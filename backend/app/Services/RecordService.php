<?php

namespace App\Services;

use App\Support\Casing;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;
use Throwable;

class RecordService
{
    private array $columnCache = [];

    public function __construct(private BranchService $branches, private VisitService $visits) {}

    public function config(string $resource): array
    {
        $config = config("records.resources.$resource");
        if (! $config) {
            throw new InvalidArgumentException("Unknown resource: $resource");
        }

        return $config;
    }

    public function list(string $resource): array
    {
        $config = $this->config($resource);
        $table = $config['table'];
        $limit = str_starts_with($resource, 'setup-') ? 50000 : 2000;
        $first = array_key_first($this->columns($table));
        $rows = DB::table($table)->orderByDesc($first)->limit($limit)->get()->map(fn ($row) => (array) $row)->all();

        if (isset($config['prices']) && $rows) {
            $rows = $this->withPrices($rows, $config['prices']);
        }

        return $rows;
    }

    public function save(string $resource, array $data): string
    {
        $config = $this->config($resource);
        $table = $config['table'];
        $columns = $this->columns($table);
        $row = $this->toRow($data, $config['aliases'] ?? [], $columns);

        if (isset($config['single_row_id'])) {
            $row['id'] = $config['single_row_id'];
        }
        if (isset($columns['branch_id']) && empty($row['branch_id'])) {
            $row['branch_id'] = $this->branches->resolve($data['branchId'] ?? null);
        }
        if (! empty($config['patient_record']) && isset($columns['visit_id']) && empty($row['visit_id']) && ! empty($row['patient_id'])) {
            $row['visit_id'] = $this->visits->currentOrNew((string) $row['patient_id'], $data);
        }
        if (! $row) {
            throw new InvalidArgumentException('Nothing to save.');
        }

        return DB::transaction(function () use ($resource, $config, $table, $row, $data) {
            if (isset($row['id'])) {
                $id = $row['id'];
                $values = $row;
                unset($values['id']);
                DB::table($table)->updateOrInsert(['id' => $id], $values);
            } else {
                $id = DB::table($table)->insertGetId($row);
            }
            $id = (string) $id;

            if (isset($config['prices']) && is_array($data['subCategoryPrices'] ?? null)) {
                $this->syncPrices($config['prices'], $id, $data['subCategoryPrices']);
            }
            $this->keepCopy($resource, $id, $data);

            return $id;
        });
    }

    public function exists(string $resource, mixed $id): bool
    {
        return $id !== null && $id !== '' && DB::table($this->config($resource)['table'])->where('id', $id)->exists();
    }

    public function delete(string $resource, string $id): void
    {
        $config = $this->config($resource);
        DB::transaction(function () use ($resource, $config, $id) {
            if (isset($config['prices'])) {
                DB::table($config['prices']['table'])->where($config['prices']['foreign_key'], $id)->delete();
            }
            DB::table($config['table'])->where('id', $id)->delete();
            DB::table('entity_store')->where('entity_type', $resource)->where('entity_id', $id)->delete();
        });
    }

    public function columns(string $table): array
    {
        if (! isset($this->columnCache[$table])) {
            $list = [];
            foreach (Schema::getColumns($table) as $column) {
                $list[$column['name']] = strtolower((string) $column['type_name']);
            }
            $this->columnCache[$table] = $list;
        }

        return $this->columnCache[$table];
    }

    private function toRow(array $data, array $aliases, array $columns): array
    {
        $row = [];
        foreach ($data as $key => $value) {
            $column = $aliases[$key] ?? Casing::toSnake((string) $key);
            if (array_key_exists($column, $columns)) {
                $row[$column] = $this->normalize($value, $columns[$column]);
            }
        }

        return $row;
    }

    private function normalize(mixed $value, string $type): mixed
    {
        if (is_array($value) || is_object($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }
        if ($value === '') {
            return null;
        }
        if (is_string($value) && in_array($type, ['date', 'datetime', 'timestamp', 'time'], true)) {
            try {
                $date = Carbon::parse($value)->setTimezone(config('app.timezone'));
            } catch (Throwable) {
                return null;
            }

            return match ($type) {
                'date' => $date->toDateString(),
                'time' => $date->format('H:i:s'),
                default => $date->format('Y-m-d H:i:s'),
            };
        }

        return $value;
    }

    private function withPrices(array $rows, array $prices): array
    {
        try {
            $found = DB::table($prices['table'].' as p')
                ->join('setup_patient_subcategories as s', 's.id', '=', 'p.sub_category_id')
                ->select('p.'.$prices['foreign_key'].' as item_id', 's.sub_category_code', 'p.price')
                ->get();
        } catch (Throwable) {
            return $rows;
        }
        $byItem = [];
        foreach ($found as $price) {
            $byItem[(string) $price->item_id][(string) $price->sub_category_code] = (float) $price->price;
        }
        foreach ($rows as &$row) {
            $id = (string) ($row['id'] ?? '');
            if (empty($byItem[$id])) {
                continue;
            }
            $existing = json_decode((string) ($row['sub_category_prices_json'] ?? ''), true);
            $row['sub_category_prices_json'] = json_encode(array_merge(is_array($existing) ? $existing : [], $byItem[$id]), JSON_UNESCAPED_UNICODE);
        }
        unset($row);

        return $rows;
    }

    private function syncPrices(array $prices, string $id, array $byCode): void
    {
        DB::table($prices['table'])->where($prices['foreign_key'], $id)->delete();
        foreach ($byCode as $code => $price) {
            $subId = DB::table('setup_patient_subcategories')->where('sub_category_code', (string) $code)->value('id');
            if (! $subId) {
                continue;
            }
            DB::table($prices['table'])->insert([$prices['foreign_key'] => $id, 'sub_category_id' => $subId, 'price' => (float) $price]);
        }
    }

    private function keepCopy(string $resource, string $id, array $data): void
    {
        try {
            DB::table('entity_store')->updateOrInsert(
                ['entity_type' => $resource, 'entity_id' => $id],
                ['patient_id' => $data['patientId'] ?? null, 'data_json' => json_encode(array_merge($data, ['id' => $data['id'] ?? $id]), JSON_UNESCAPED_UNICODE)]
            );
        } catch (Throwable) {
        }
    }
}
