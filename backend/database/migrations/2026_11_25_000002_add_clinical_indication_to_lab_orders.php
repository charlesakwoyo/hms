<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('lab_orders', 'clinical_indication')) {
            Schema::table('lab_orders', function (Blueprint $table) {
                $table->text('clinical_indication')->nullable()->after('sample_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('lab_orders', 'clinical_indication')) {
            Schema::table('lab_orders', function (Blueprint $table) {
                $table->dropColumn('clinical_indication');
            });
        }
    }
};
