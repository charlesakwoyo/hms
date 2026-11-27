<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'specimen_accession_no',
            'collected_by',
            'received_by',
            'rejected_by',
            'rejected_at',
            'rejection_reason',
            'recollection_count',
            'result_entered_by',
            'verified_by',
            'verified_at',
        ];
        $missing = array_values(array_filter($columns, fn ($column) => ! Schema::hasColumn('lab_orders', $column)));
        if ($missing === []) {
            return;
        }

        Schema::table('lab_orders', function (Blueprint $table) use ($missing) {
            if (in_array('specimen_accession_no', $missing, true)) $table->string('specimen_accession_no', 80)->nullable();
            if (in_array('collected_by', $missing, true)) $table->string('collected_by', 180)->nullable();
            if (in_array('received_by', $missing, true)) $table->string('received_by', 180)->nullable();
            if (in_array('rejected_by', $missing, true)) $table->string('rejected_by', 180)->nullable();
            if (in_array('rejected_at', $missing, true)) $table->dateTime('rejected_at')->nullable();
            if (in_array('rejection_reason', $missing, true)) $table->text('rejection_reason')->nullable();
            if (in_array('recollection_count', $missing, true)) $table->unsignedInteger('recollection_count')->default(0);
            if (in_array('result_entered_by', $missing, true)) $table->string('result_entered_by', 180)->nullable();
            if (in_array('verified_by', $missing, true)) $table->string('verified_by', 180)->nullable();
            if (in_array('verified_at', $missing, true)) $table->dateTime('verified_at')->nullable();
        });
    }

    public function down(): void
    {
        $columns = [
            'specimen_accession_no', 'collected_by', 'received_by', 'rejected_by', 'rejected_at',
            'rejection_reason', 'recollection_count', 'result_entered_by', 'verified_by', 'verified_at',
        ];
        $existing = array_values(array_filter($columns, fn ($column) => Schema::hasColumn('lab_orders', $column)));
        if ($existing !== []) {
            Schema::table('lab_orders', fn (Blueprint $table) => $table->dropColumn($existing));
        }
    }
};
