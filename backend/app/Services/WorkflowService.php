<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkflowService
{
    public function record(
        string $patientId,
        string $sourceEntity,
        string $sourceId,
        string $workflowCode,
        ?string $fromStation,
        ?string $toStation,
        string $eventType,
        array $context,
        ?string $notes = null
    ): string {
        $id = 'WF-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));

        DB::table('workflow_events')->insert([
            'id' => $id,
            'patient_id' => $patientId,
            'source_entity' => $sourceEntity,
            'source_id' => $sourceId,
            'workflow_code' => $workflowCode,
            'from_station' => $fromStation,
            'to_station' => $toStation,
            'event_type' => $eventType,
            'status' => 'Completed',
            'performed_by' => $context['actor_id'] ?? null,
            'notes' => $notes,
            'created_at' => now(),
            'branch_id' => $context['branch_id'] ?? null,
        ]);

        return $id;
    }
}
