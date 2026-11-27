<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\BranchService;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;

class TriageController extends Controller
{
    use GuardsPatientModule;

    public function __construct(
        private AuditService $audit,
        private WorkflowService $workflow,
        private BranchService $branches
    ) {}

    public function worklist(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'triage.view')) {
            return $this->denied();
        }
        if (! DB::getSchemaBuilder()->hasTable('vitals_triage')) {
            return response()->json(['success' => false, 'error' => 'The triage records table is not available. Run the database migrations.'], 503);
        }

        $rows = DB::table('patient_queue as q')
            ->join('patients as p', 'p.id', '=', 'q.patient_id')
            ->where('q.current_station', 'Triage')
            ->where('q.arrived_time', '>=', now()->subDay())
            ->orderByRaw("CASE WHEN q.priority = 'Emergency' THEN 0 WHEN q.priority = 'Urgent' THEN 1 ELSE 2 END")
            ->orderBy('q.arrived_time')
            ->select([
                'q.id as queue_id',
                'q.ticket_number',
                'q.patient_id',
                'q.patient_name',
                'q.visit_id',
                'q.arrived_time',
                'q.priority',
                'q.payment_method',
                'q.consultation_fee_paid',
                'q.status as queue_status',
                'p.age',
                'p.dob',
                'p.gender',
                'p.phone',
                'p.blood_group',
                'p.allergies',
            ])->get();

        $data = $rows->map(function ($row) {
            $assessment = DB::table('vitals_triage')
                ->where('patient_id', $row->patient_id)
                ->where('visit_id', $row->visit_id)
                ->orderByDesc('recorded_at')
                ->first();

            return [
                'queueId' => (string) $row->queue_id,
                'ticketNumber' => (string) $row->ticket_number,
                'patientId' => (string) $row->patient_id,
                'patientName' => (string) $row->patient_name,
                'visitId' => (string) $row->visit_id,
                'arrivedTime' => (string) $row->arrived_time,
                'priority' => (string) $row->priority,
                'paymentMethod' => (string) ($row->payment_method ?? ''),
                'consultationFeePaid' => (bool) $row->consultation_fee_paid,
                'status' => $assessment ? 'Triaged' : 'Waiting',
                'age' => $row->age,
                'dob' => $row->dob,
                'gender' => $row->gender,
                'phone' => $row->phone,
                'bloodGroup' => $row->blood_group,
                'allergies' => $row->allergies,
                'assessment' => $assessment ? $this->assessmentPayload($assessment) : null,
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function save(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'triage.assess')) {
            return $this->denied();
        }
        if (! DB::getSchemaBuilder()->hasTable('vitals_triage')) {
            return response()->json(['success' => false, 'error' => 'The triage records table is not available. Run the database migrations.'], 503);
        }

        $validator = Validator::make($request->all(), [
            'presentingComplaint' => ['required', 'string', 'max:2000'],
            'systolic' => ['nullable', 'numeric', 'between:0,400'],
            'diastolic' => ['nullable', 'numeric', 'between:0,300'],
            'pulse' => ['nullable', 'numeric', 'between:0,300'],
            'temperature' => ['nullable', 'numeric', 'between:25,45'],
            'respiratoryRate' => ['nullable', 'numeric', 'between:0,100'],
            'spo2' => ['nullable', 'numeric', 'between:0,100'],
            'weightKg' => ['nullable', 'numeric', 'between:0,500'],
            'heightCm' => ['nullable', 'numeric', 'between:0,300'],
            'triageCategory' => ['required', 'in:Normal,Urgent,Emergency'],
            'nurseNotes' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        try {
            $assessment = DB::transaction(function () use ($queue, $data, $request) {
                $entry = DB::table('patient_queue')->where('id', $queue)->lockForUpdate()->first();
                if (! $entry) {
                    throw new RuntimeException('Queue entry not found.', 404);
                }
                if ($entry->current_station !== 'Triage') {
                    throw new RuntimeException('Triage can only be recorded while the patient is in the Triage queue.', 422);
                }
                if (! DB::table('patient_visits')->where('id', $entry->visit_id)->where('patient_id', $entry->patient_id)->exists()) {
                    throw new RuntimeException('The patient visit linked to this queue entry could not be found.', 422);
                }

                $weight = isset($data['weightKg']) ? (float) $data['weightKg'] : null;
                $height = isset($data['heightCm']) ? (float) $data['heightCm'] : null;
                $bmi = $weight && $height ? round($weight / (($height / 100) ** 2), 2) : null;
                $branchId = (int) ($request->header('X-Branch-Id') ?? $entry->branch_id ?? 1);
                $branchId = $this->branches->resolve($branchId);
                $id = 'TRI-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                $record = [
                    'id' => $id,
                    'patient_id' => $entry->patient_id,
                    'systolic' => $data['systolic'] ?? null,
                    'diastolic' => $data['diastolic'] ?? null,
                    'pulse' => $data['pulse'] ?? null,
                    'temperature' => $data['temperature'] ?? null,
                    'respiratory_rate' => $data['respiratoryRate'] ?? null,
                    'spo2' => $data['spo2'] ?? null,
                    'weight_kg' => $weight,
                    'height_cm' => $height,
                    'bmi' => $bmi,
                    'bmi_category' => null,
                    'triage_category' => $data['triageCategory'],
                    'presenting_complaint' => $data['presentingComplaint'],
                    'nurse_notes' => $data['nurseNotes'] ?? null,
                    'recorded_by' => (string) ($request->user()?->full_name ?? 'Triage Staff'),
                    'recorded_at' => now(),
                    'branch_id' => $branchId,
                    'visit_id' => $entry->visit_id,
                ];
                DB::table('vitals_triage')->insert($record);
                DB::table('patient_queue')->where('id', $queue)->update(['priority' => $data['triageCategory']]);

                $this->audit->record(
                    (string) ($request->user()?->id ?? ''),
                    'TRIAGE_ASSESSMENT_RECORDED',
                    'vitals_triage',
                    $id,
                    ['queue_id' => $queue, 'visit_id' => $entry->visit_id],
                    $request->ip(),
                    $branchId
                );
                $this->workflow->record(
                    (string) $entry->patient_id,
                    'vitals_triage',
                    $id,
                    'CONSULTATION',
                    'Triage',
                    'Triage',
                    'TRIAGE_ASSESSMENT_RECORDED',
                    ['actor_id' => $request->user()?->id, 'branch_id' => $branchId],
                    'Triage assessment recorded.'
                );

                return $record;
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $this->assessmentPayload((object) $assessment)]);
    }

    private function assessmentPayload(object $assessment): array
    {
        return [
            'id' => (string) $assessment->id,
            'systolic' => $assessment->systolic,
            'diastolic' => $assessment->diastolic,
            'pulse' => $assessment->pulse,
            'temperature' => $assessment->temperature,
            'respiratoryRate' => $assessment->respiratory_rate,
            'spo2' => $assessment->spo2,
            'weightKg' => $assessment->weight_kg,
            'heightCm' => $assessment->height_cm,
            'bmi' => $assessment->bmi,
            'triageCategory' => $assessment->triage_category,
            'presentingComplaint' => $assessment->presenting_complaint,
            'nurseNotes' => $assessment->nurse_notes,
            'recordedBy' => $assessment->recorded_by,
            'recordedAt' => $assessment->recorded_at,
        ];
    }
}
