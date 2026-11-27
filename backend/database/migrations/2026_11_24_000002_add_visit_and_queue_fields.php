<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('patient_visits')) {
            if (! Schema::hasColumn('patient_visits', 'visit_type')) {
                Schema::table('patient_visits', fn (Blueprint $table) => $table->string('visit_type', 40)->nullable());
            }
            if (! Schema::hasColumn('patient_visits', 'practitioner_id')) {
                Schema::table('patient_visits', fn (Blueprint $table) => $table->string('practitioner_id', 50)->nullable());
            }
            if (! Schema::hasColumn('patient_visits', 'closed_by')) {
                Schema::table('patient_visits', fn (Blueprint $table) => $table->string('closed_by', 50)->nullable());
            }

            DB::table('patient_visits')->whereNull('visit_type')->orderBy('id')->chunkById(100, function ($visits) {
                foreach ($visits as $visit) {
                    DB::table('patient_visits')->where('id', $visit->id)->update(['visit_type' => 'Outpatient']);
                }
            });

            $this->addIndex('patient_visits', 'idx_pv_patient_status_date', ['patient_id', 'status', 'visit_date']);
        }

        if (Schema::hasTable('patient_queue')) {
            $this->addIndex('patient_queue', 'idx_queue_patient_status_arrived', ['patient_id', 'status', 'arrived_time']);

            $duplicates = DB::selectOne(
                'SELECT COUNT(*) AS total FROM (SELECT branch_id, ticket_number FROM patient_queue WHERE ticket_number IS NOT NULL GROUP BY branch_id, ticket_number HAVING COUNT(*) > 1) AS duplicates'
            );

            if ((int) ($duplicates?->total ?? 0) === 0) {
                $this->addIndex('patient_queue', 'uq_patient_queue_branch_ticket', ['branch_id', 'ticket_number'], true);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('patient_queue')) {
            $this->dropIndex('patient_queue', 'uq_patient_queue_branch_ticket');
            $this->dropIndex('patient_queue', 'idx_queue_patient_status_arrived');
        }

        if (Schema::hasTable('patient_visits')) {
            $this->dropIndex('patient_visits', 'idx_pv_patient_status_date');

            foreach (['visit_type', 'practitioner_id', 'closed_by'] as $column) {
                if (Schema::hasColumn('patient_visits', $column)) {
                    Schema::table('patient_visits', fn (Blueprint $table) => $table->dropColumn($column));
                }
            }
        }
    }

    private function addIndex(string $table, string $name, array $fields, bool $unique = false): void
    {
        if ($this->indexExists($table, $name)) {
            return;
        }
        if (collect($fields)->contains(fn ($field) => ! Schema::hasColumn($table, $field))) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($fields, $name, $unique) {
            $unique ? $blueprint->unique($fields, $name) : $blueprint->index($fields, $name);
        });
    }

    private function dropIndex(string $table, string $name): void
    {
        if ($this->indexExists($table, $name)) {
            Schema::table($table, fn (Blueprint $blueprint) => $blueprint->dropIndex($name));
        }
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
