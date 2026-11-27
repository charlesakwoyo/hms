<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('vitals_triage') && ! Schema::hasColumn('vitals_triage', 'presenting_complaint')) {
            Schema::table('vitals_triage', fn (Blueprint $table) => $table->text('presenting_complaint')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('vitals_triage') && Schema::hasColumn('vitals_triage', 'presenting_complaint')) {
            Schema::table('vitals_triage', fn (Blueprint $table) => $table->dropColumn('presenting_complaint'));
        }
    }
};
