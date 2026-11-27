<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('patients')) {
            return;
        }

        $columns = [
            'registered_by' => fn (Blueprint $table) => $table->string('registered_by', 50)->nullable(),
            'registration_source' => fn (Blueprint $table) => $table->string('registration_source', 40)->nullable(),
            'phone_normalized' => fn (Blueprint $table) => $table->string('phone_normalized', 30)->nullable(),
            'national_id_normalized' => fn (Blueprint $table) => $table->string('national_id_normalized', 80)->nullable(),
            'full_name_normalized' => fn (Blueprint $table) => $table->string('full_name_normalized', 180)->nullable(),
        ];

        foreach ($columns as $column => $definition) {
            if (! Schema::hasColumn('patients', $column)) {
                Schema::table('patients', function (Blueprint $table) use ($definition) {
                    $definition($table);
                });
            }
        }

        DB::table('patients')->orderBy('id')->chunkById(100, function ($patients) {
            foreach ($patients as $patient) {
                $changes = [];

                if (Schema::hasColumn('patients', 'phone_normalized') && $patient->phone_normalized === null) {
                    $changes['phone_normalized'] = $this->normalizePhone((string) ($patient->phone ?? ''));
                }
                if (Schema::hasColumn('patients', 'national_id_normalized') && $patient->national_id_normalized === null) {
                    $changes['national_id_normalized'] = $this->normalizeIdentifier((string) ($patient->national_id ?? ''));
                }
                if (Schema::hasColumn('patients', 'full_name_normalized') && $patient->full_name_normalized === null) {
                    $changes['full_name_normalized'] = $this->normalizeName((string) ($patient->full_name ?? ''));
                }
                if (Schema::hasColumn('patients', 'registration_source') && $patient->registration_source === null) {
                    $changes['registration_source'] = 'Legacy';
                }

                if ($changes !== []) {
                    DB::table('patients')->where('id', $patient->id)->update($changes);
                }
            }
        });

        $indexes = [
            'idx_patients_phone_normalized' => ['phone_normalized'],
            'idx_patients_national_normalized' => ['national_id_normalized'],
            'idx_patients_name_dob_normalized' => ['full_name_normalized', 'dob'],
            'idx_patients_email' => ['email'],
            'idx_patients_birth_certificate' => ['birth_certificate_no'],
            'idx_patients_status_branch_category' => ['status', 'branch_id', 'patient_category_id'],
        ];

        foreach ($indexes as $name => $fields) {
            if ($this->indexExists('patients', $name) && ! collect($fields)->contains(fn ($field) => ! Schema::hasColumn('patients', $field))) {
                continue;
            }
            if (collect($fields)->contains(fn ($field) => ! Schema::hasColumn('patients', $field))) {
                continue;
            }
            Schema::table('patients', fn (Blueprint $table) => $table->index($fields, $name));
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('patients')) {
            return;
        }

        foreach ([
            'idx_patients_phone_normalized',
            'idx_patients_national_normalized',
            'idx_patients_name_dob_normalized',
            'idx_patients_email',
            'idx_patients_birth_certificate',
            'idx_patients_status_branch_category',
        ] as $name) {
            if ($this->indexExists('patients', $name)) {
                Schema::table('patients', fn (Blueprint $table) => $table->dropIndex($name));
            }
        }

        foreach (['registered_by', 'registration_source', 'phone_normalized', 'national_id_normalized', 'full_name_normalized'] as $column) {
            if (Schema::hasColumn('patients', $column)) {
                Schema::table('patients', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }
    }

    private function normalizePhone(string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }
        if (str_starts_with($value, '+254')) {
            return '0'.substr($value, 4);
        }
        if (str_starts_with($value, '254')) {
            return '0'.substr($value, 3);
        }

        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return $digits !== '' ? $digits : null;
    }

    private function normalizeIdentifier(string $value): ?string
    {
        $value = strtoupper(trim($value));

        return $value !== '' ? $value : null;
    }

    private function normalizeName(string $value): ?string
    {
        $value = strtolower((string) preg_replace('/[^a-z0-9 ]+/i', ' ', trim($value)));
        $value = (string) preg_replace('/\s+/', ' ', $value);

        return trim($value) !== '' ? trim($value) : null;
    }

    private function indexExists(string $table, string $name): bool
    {
        $result = DB::selectOne(
            'SELECT COUNT(*) AS total FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
            [$table, $name]
        );

        return (int) ($result?->total ?? 0) > 0;
    }
};
