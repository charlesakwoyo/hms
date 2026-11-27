<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consultation_dispositions')) {
            return;
        }

        Schema::create('consultation_dispositions', function (Blueprint $table) {
            $table->string('id', 80)->primary();
            $table->string('queue_id', 50);
            $table->string('patient_id', 50);
            $table->string('visit_id', 50)->unique();
            $table->string('outcome', 30);
            $table->text('reason')->nullable();
            $table->string('urgency', 30)->nullable();
            $table->text('instructions')->nullable();
            $table->string('status', 30);
            $table->string('decided_by', 180)->nullable();
            $table->dateTime('decided_at');
            $table->timestamps();

            $table->index(['patient_id', 'status'], 'idx_consultation_dispositions_patient');
            $table->index('queue_id', 'idx_consultation_dispositions_queue');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_dispositions');
    }
};
