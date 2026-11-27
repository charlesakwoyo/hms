<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class VisitService
{
    public function __construct(
        private SequenceService $sequences,
        private BranchService $branches,
        private AuditService $audit
    ) {}

    public function currentOrNew(string $patientId, array $context = []): string
    {
        return $this->open($patientId, $context)['id'];
    }

    public function open(string $patientId, array $context = []): array
    {
        $requested = $context['visitId'] ?? null;
        if ($requested && DB::table('patient_visits')->where('id', $requested)->where('patient_id', $patientId)->first()) {
            return $this->visit($requested);
        }

        if (empty($context['newVisit'])) {
            $active = $this->active($patientId);
            if ($active) {
                return $active;
            }
        }

        $patient = DB::table('patients')->where('id', $patientId)->first();
        if (! $patient) {
            throw new RuntimeException('Patient not found.', 404);
        }

        $appointmentId = null;
        if (! empty($context['appointmentId'])) {
            $appointment = DB::table('appointments')->where('id', $context['appointmentId'])->where('patient_id', $patientId)->first();
            if (! $appointment) {
                throw new RuntimeException('Appointment not found for this patient.', 422);
            }
            if (! in_array(strtolower((string) $appointment->status), ['scheduled', 'confirmed'], true)) {
                throw new RuntimeException('Only a scheduled appointment can open a visit.', 422);
            }
            $appointmentId = (string) $appointment->id;
            $context['source'] = 'Appointment';
            $context['departmentId'] ??= $appointment->department_id;
            $context['consultationServiceId'] ??= $appointment->consultation_service_id;
        }

        $schemeId = $context['schemeId'] ?? $patient->scheme_id;
        $branchId = $this->branches->resolve($context['branchId'] ?? $patient->branch_id);
        $id = 'VISIT-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
        $visitNumber = $this->sequences->next(config('patients.sequences.visit', 'VISIT'), 'V-');

        $row = [
            'id' => $id,
            'visit_number' => $visitNumber,
            'patient_id' => $patientId,
            'branch_id' => $branchId,
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i:s'),
            'visit_type' => $context['visitType'] ?? 'Outpatient',
            'encounter_type' => $context['encounterType'] ?? 'Outpatient',
            'department_id' => $context['departmentId'] ?? null,
            'practitioner_id' => $context['practitionerId'] ?? null,
            'patient_category_id' => $context['patientCategoryId'] ?? $patient->patient_category_id,
            'patient_sub_category_id' => $context['patientSubCategoryId'] ?? $patient->patient_sub_category_id,
            'scheme_id' => $schemeId,
            'scheme_name' => $schemeId ? DB::table('setup_patient_schemes')->where('id', $schemeId)->value('scheme_name') : null,
            'status' => 'Open',
            'source' => $context['source'] ?? 'Registration',
            'opened_by' => $context['actor_id'] ?? $context['openedBy'] ?? null,
            'notes' => $context['notes'] ?? null,
        ];

        DB::table('patient_visits')->insert($row);

        if ($appointmentId) {
            DB::table('appointments')->where('id', $appointmentId)->update(['visit_id' => $id]);
            $row['appointment_id'] = $appointmentId;
        }

        $this->audit->record(
            $context['actor_id'] ?? null,
            'VISIT_OPENED',
            'patient_visits',
            $id,
            ['appointment_id' => $appointmentId, 'source' => $row['source']],
            $context['ip'] ?? null,
            (int) ($context['branch_id'] ?? $branchId),
            [],
            $row
        );

        return $this->visit($id);
    }

    public function active(string $patientId): ?array
    {
        $since = now()->subDay()->format('Y-m-d H:i:s');
        $visit = DB::table('patient_visits')
            ->where('patient_id', $patientId)
            ->whereIn('status', config('patients.active_visit_statuses', ['Open', 'In Progress']))
            ->where(function ($query) use ($since, $patientId) {
                $query->whereRaw("TIMESTAMP(visit_date, COALESCE(visit_time, '00:00:00')) >= ?", [$since])
                    ->orWhereExists(fn ($q) => $q->from('admissions')->where('patient_id', $patientId)->where('status', 'Admitted'))
                    ->orWhereExists(fn ($q) => $q->from('patients')->where('id', $patientId)->where('status', 'Admitted'));
            })
            ->orderByDesc('visit_date')->orderByDesc('created_at')
            ->first();

        return $visit ? (array) $visit : null;
    }

    public function recent(string $patientId, int $limit = 20): array
    {
        return DB::table('patient_visits')->where('patient_id', $patientId)
            ->orderByDesc('visit_date')->orderByDesc('created_at')->limit($limit)
            ->get()->map(fn ($row) => (array) $row)->all();
    }

    public function visit(string $id): array
    {
        $row = DB::table('patient_visits')->where('id', $id)->first();
        if (! $row) {
            throw new RuntimeException('Visit not found.', 404);
        }

        return (array) $row;
    }

    public function cancel(string $id, array $context): array
    {
        return $this->closeVisit($id, 'Cancelled', $context, 'VISIT_CANCELLED');
    }

    public function close(string $id, array $context): array
    {
        return $this->closeVisit($id, 'Closed', $context, 'VISIT_CLOSED');
    }

    private function closeVisit(string $id, string $status, array $context, string $action): array
    {
        $before = $this->visit($id);
        if (in_array($before['status'], ['Closed', 'Cancelled'], true)) {
            throw new RuntimeException('This visit is already closed or cancelled.', 422);
        }

        $changes = [
            'status' => $status,
            'closed_at' => now(),
            'closed_by' => $context['actor_id'] ?? null,
        ];
        DB::table('patient_visits')->where('id', $id)->update($changes);

        $after = $this->visit($id);
        $this->audit->record(
            $context['actor_id'] ?? null,
            $action,
            'patient_visits',
            $id,
            [],
            $context['ip'] ?? null,
            (int) ($context['branch_id'] ?? $before['branch_id']),
            ['status' => $before['status'], 'closed_at' => $before['closed_at']],
            ['status' => $after['status'], 'closed_at' => $after['closed_at'], 'closed_by' => $after['closed_by']]
        );

        return $after;
    }
}
