<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VisitService
{
    public function __construct(private SequenceService $sequences, private BranchService $branches) {}

    public function currentOrNew(string $patientId, array $context = []): string
    {
        $requested = $context['visitId'] ?? null;
        if ($requested && DB::table('patient_visits')->where('id', $requested)->where('patient_id', $patientId)->exists()) {
            return (string) $requested;
        }

        if (empty($context['newVisit'])) {
            $since = now()->subDay()->format('Y-m-d H:i:s');
            $existing = DB::table('patient_visits')
                ->where('patient_id', $patientId)
                ->whereIn('status', ['Open', 'In Progress'])
                ->where(function ($query) use ($since, $patientId) {
                    $query->whereRaw("TIMESTAMP(visit_date, COALESCE(visit_time, '00:00:00')) >= ?", [$since])
                        ->orWhereExists(fn ($q) => $q->from('admissions')->where('patient_id', $patientId)->where('status', 'Admitted'))
                        ->orWhereExists(fn ($q) => $q->from('patients')->where('id', $patientId)->where('status', 'Admitted'));
                })
                ->orderByDesc('visit_date')->orderByDesc('created_at')
                ->value('id');
            if ($existing) {
                return (string) $existing;
            }
        }

        $patient = DB::table('patients')->where('id', $patientId)->first();
        $schemeId = $context['schemeId'] ?? $patient?->scheme_id;
        $id = 'VISIT-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));

        DB::table('patient_visits')->insert([
            'id' => $id,
            'visit_number' => $this->sequences->next('VISIT', 'V-'),
            'patient_id' => $patientId,
            'branch_id' => $this->branches->resolve($context['branchId'] ?? $patient?->branch_id),
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i:s'),
            'encounter_type' => $context['encounterType'] ?? 'Outpatient',
            'department_id' => $context['departmentId'] ?? null,
            'patient_category_id' => $context['patientCategoryId'] ?? $patient?->patient_category_id,
            'patient_sub_category_id' => $context['patientSubCategoryId'] ?? $patient?->patient_sub_category_id,
            'scheme_id' => $schemeId,
            'scheme_name' => $schemeId ? DB::table('setup_patient_schemes')->where('id', $schemeId)->value('scheme_name') : null,
            'status' => 'Open',
            'source' => $context['source'] ?? 'Registration',
            'opened_by' => $context['openedBy'] ?? null,
        ]);

        return $id;
    }
}
