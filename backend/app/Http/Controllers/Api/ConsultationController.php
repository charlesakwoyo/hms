<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\QueueService;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use RuntimeException;

class ConsultationController extends Controller
{
    use GuardsPatientModule;

    public function __construct(private AuditService $audit, private QueueService $queue, private VisitService $visits) {}

    public function worklist(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.read')) {
            return $this->denied();
        }

        $rows = DB::table('patient_queue as q')
            ->join('patients as p', 'p.id', '=', 'q.patient_id')
            ->leftJoin('consultation_dispositions as d', 'd.visit_id', '=', 'q.visit_id')
            ->where('q.current_station', 'Consultation')
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
                'q.consultation_type',
                'p.age',
                'p.dob',
                'p.gender',
                'p.phone',
                'p.blood_group',
                'p.allergies',
                'd.outcome as disposition_outcome',
                'd.status as disposition_status',
            ])->get();

        $data = $rows->map(fn ($row) => [
            'queueId' => (string) $row->queue_id,
            'ticketNumber' => (string) $row->ticket_number,
            'patientId' => (string) $row->patient_id,
            'patientName' => (string) $row->patient_name,
            'visitId' => (string) $row->visit_id,
            'arrivedTime' => (string) $row->arrived_time,
            'priority' => (string) $row->priority,
            'paymentMethod' => (string) ($row->payment_method ?? ''),
            'consultationFeePaid' => (bool) $row->consultation_fee_paid,
            'consultationType' => $row->consultation_type,
            'age' => $row->age,
            'dob' => $row->dob,
            'gender' => $row->gender,
            'phone' => $row->phone,
            'bloodGroup' => $row->blood_group,
            'allergies' => $row->allergies,
            'dispositionOutcome' => $row->disposition_outcome,
            'dispositionStatus' => $row->disposition_status,
        ])->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function encounter(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.read')) {
            return $this->denied();
        }
        try {
            $entry = $this->queueEntry($queue);
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        $record = DB::table('consultations')->where('patient_id', $entry->patient_id)
            ->where('visit_id', $entry->visit_id)->orderByDesc('timestamp_value')->first();
        $diagnoses = $record
            ? DB::table('consultation_diagnoses')->where('consultation_id', $record->id)->orderBy('id')->get()
            : collect();
        $triage = DB::table('vitals_triage')->where('patient_id', $entry->patient_id)
            ->where('visit_id', $entry->visit_id)->orderByDesc('recorded_at')->first();
        $labOrders = DB::table('lab_orders')->where('patient_id', $entry->patient_id)
            ->where('visit_id', $entry->visit_id)->orderByDesc('requested_at')->get();
        $disposition = DB::table('consultation_dispositions')->where('visit_id', $entry->visit_id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'patient' => [
                    'id' => (string) $entry->patient_id,
                    'name' => (string) $entry->patient_name,
                    'age' => $entry->age,
                    'dob' => $entry->dob,
                    'gender' => $entry->gender,
                    'phone' => $entry->phone,
                    'bloodGroup' => $entry->blood_group,
                    'allergies' => $entry->allergies,
                ],
                'queue' => [
                    'id' => (string) $entry->id,
                    'ticketNumber' => (string) $entry->ticket_number,
                    'visitId' => (string) $entry->visit_id,
                    'priority' => (string) $entry->priority,
                    'paymentMethod' => (string) ($entry->payment_method ?? ''),
                    'consultationFeePaid' => (bool) $entry->consultation_fee_paid,
                    'consultationType' => $entry->consultation_type,
                ],
                'triage' => $triage ? [
                    'presentingComplaint' => $triage->presenting_complaint,
                    'systolic' => $triage->systolic,
                    'diastolic' => $triage->diastolic,
                    'pulse' => $triage->pulse,
                    'temperature' => $triage->temperature,
                    'respiratoryRate' => $triage->respiratory_rate,
                    'spo2' => $triage->spo2,
                    'weightKg' => $triage->weight_kg,
                    'heightCm' => $triage->height_cm,
                    'triageCategory' => $triage->triage_category,
                    'nurseNotes' => $triage->nurse_notes,
                    'recordedAt' => $triage->recorded_at,
                ] : null,
                'consultation' => $record ? [
                    'id' => (string) $record->id,
                    'chiefComplaint' => $record->chief_complaint,
                    'historyOfPresentIllness' => $record->history_of_present_illness,
                    'examinationFindings' => $record->examination_findings,
                    'provisionalDiagnosis' => $record->provisional_diagnosis,
                    'icdCode' => $record->icd_code,
                    'managementPlan' => $record->management_plan,
                    'status' => $record->status,
                ] : null,
                'diagnoses' => $diagnoses->map(fn ($diagnosis) => [
                    'id' => (int) $diagnosis->id,
                    'code' => $diagnosis->diagnosis_code,
                    'title' => $diagnosis->diagnosis_title,
                    'type' => $diagnosis->diagnosis_type,
                ])->values(),
                'labOrders' => $labOrders->map(fn ($order) => [
                    'id' => (string) $order->id,
                    'testName' => $order->test_name,
                    'code' => $order->setup_lab_test_code,
                    'status' => $order->status,
                    'clinicalIndication' => $order->clinical_indication,
                    'requestedAt' => $order->requested_at,
                    'resultValue' => $order->result_value,
                    'referenceRange' => $order->reference_range,
                    'resultNotes' => $order->result_notes,
                    'resultEnteredBy' => $order->result_entered_by,
                    'verifiedBy' => $order->verified_by,
                    'verifiedAt' => $order->verified_at,
                ])->values(),
                'disposition' => $disposition ? [
                    'outcome' => $disposition->outcome,
                    'reason' => $disposition->reason,
                    'urgency' => $disposition->urgency,
                    'instructions' => $disposition->instructions,
                    'status' => $disposition->status,
                    'decidedBy' => $disposition->decided_by,
                    'decidedAt' => $disposition->decided_at,
                ] : null,
            ],
        ]);
    }

    public function saveDisposition(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.write')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'outcome' => ['required', 'in:Discharge,Admission'],
            'instructions' => ['required_if:outcome,Discharge', 'nullable', 'string', 'min:3', 'max:5000'],
            'reason' => ['required_if:outcome,Admission', 'nullable', 'string', 'min:3', 'max:2000'],
            'urgency' => ['required_if:outcome,Admission', 'nullable', 'in:Routine,Urgent,Emergency'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($queue, $request, $validator) {
                $entry = $this->queueEntry($queue);
                $data = $validator->validated();
                if (DB::table('consultation_dispositions')->where('visit_id', $entry->visit_id)->exists()) {
                    throw new RuntimeException('A disposition has already been recorded for this visit.', 422);
                }

                if ($data['outcome'] === 'Discharge') {
                    $consultation = DB::table('consultations')->where('patient_id', $entry->patient_id)
                        ->where('visit_id', $entry->visit_id)->orderByDesc('timestamp_value')->first();
                    if (! $consultation || trim((string) $consultation->management_plan) === '') {
                        throw new RuntimeException('Save the clinician assessment and plan before discharging this patient.', 422);
                    }
                    $openLabOrders = DB::table('lab_orders')->where('patient_id', $entry->patient_id)
                        ->where('visit_id', $entry->visit_id)
                        ->whereNotIn('status', ['Verified', 'Cancelled', 'Canceled'])
                        ->exists();
                    if ($openLabOrders) {
                        throw new RuntimeException('Resolve or cancel all outstanding laboratory orders before discharge.', 422);
                    }
                }

                $id = 'DISP-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                $status = $data['outcome'] === 'Discharge' ? 'Completed' : 'Admission Requested';
                DB::table('consultation_dispositions')->insert([
                    'id' => $id,
                    'queue_id' => $entry->id,
                    'patient_id' => $entry->patient_id,
                    'visit_id' => $entry->visit_id,
                    'outcome' => $data['outcome'],
                    'reason' => $data['reason'] ?? null,
                    'urgency' => $data['urgency'] ?? null,
                    'instructions' => $data['instructions'] ?? null,
                    'status' => $status,
                    'decided_by' => $request->user()?->full_name,
                    'decided_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if ($data['outcome'] === 'Discharge') {
                    $before = ['current_station' => $entry->current_station, 'status' => $entry->status];
                    DB::table('patient_queue')->where('id', $queue)->update([
                        'current_station' => 'Discharged',
                        'status' => 'Completed',
                    ]);
                    $this->visits->close($entry->visit_id, $this->moduleContext($request));
                    $this->audit->record(
                        (string) $request->user()?->id,
                        'QUEUE_ENCOUNTER_DISCHARGED',
                        'patient_queue',
                        $queue,
                        ['visit_id' => $entry->visit_id],
                        $request->ip(),
                        (int) $entry->branch_id,
                        $before,
                        ['current_station' => 'Discharged', 'status' => 'Completed']
                    );
                }

                $this->audit->record(
                    (string) $request->user()?->id,
                    $data['outcome'] === 'Discharge' ? 'CONSULTATION_DISCHARGED' : 'CONSULTATION_ADMISSION_REQUESTED',
                    'consultation_dispositions',
                    $id,
                    ['queue_id' => $queue, 'visit_id' => $entry->visit_id],
                    $request->ip(),
                    (int) $entry->branch_id,
                    [],
                    ['outcome' => $data['outcome'], 'status' => $status]
                );

                return [
                    'id' => $id,
                    'outcome' => $data['outcome'],
                    'status' => $status,
                    'visitId' => (string) $entry->visit_id,
                ];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function laboratoryCatalog(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.read')) {
            return $this->denied();
        }

        $search = trim((string) $request->query('search', ''));
        if (mb_strlen($search) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $rows = DB::table('setup_lab_tests')
            ->where(function ($query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%');
            })
            ->where(function ($query) {
                $query->whereNull('status')->orWhereRaw('LOWER(status) != ?', ['inactive']);
            })
            ->orderBy('name')
            ->limit(30)
            ->get(['id', 'code', 'name', 'department', 'specimen_type']);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function orderLaboratoryTests(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.write')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'testIds' => ['required', 'array', 'min:1', 'max:20'],
            'testIds.*' => ['required', 'integer', 'distinct', 'min:1'],
            'clinicalIndication' => ['required', 'string', 'min:3', 'max:2000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($queue, $request, $validator) {
                $entry = $this->queueEntry($queue);
                $testIds = $validator->validated()['testIds'];
                $tests = DB::table('setup_lab_tests')->whereIn('id', $testIds)
                    ->where(function ($query) {
                        $query->whereNull('status')->orWhereRaw('LOWER(status) != ?', ['inactive']);
                    })->get()->keyBy('id');
                if ($tests->count() !== count($testIds)) {
                    throw new RuntimeException('One or more selected laboratory tests are unavailable. Refresh the catalogue and try again.', 422);
                }

                $orders = [];
                foreach ($testIds as $testId) {
                    $test = $tests->get($testId);
                    $orderId = 'LAB-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                    DB::table('lab_orders')->insert([
                        'id' => $orderId,
                        'patient_id' => $entry->patient_id,
                        'patient_name' => $entry->patient_name,
                        'test_name' => $test->name,
                        'category' => $test->department,
                        'sample_type' => $test->specimen_type,
                        'clinical_indication' => $validator->validated()['clinicalIndication'],
                        'requested_by' => $request->user()?->full_name,
                        'requested_at' => now(),
                        'status' => 'Pending',
                        'setup_lab_test_id' => $test->id,
                        'setup_lab_test_code' => $test->code,
                        'billing_status' => 'Unpaid',
                        'branch_id' => $entry->branch_id,
                        'visit_id' => $entry->visit_id,
                    ]);
                    $orders[] = [
                        'id' => $orderId,
                        'testName' => $test->name,
                        'code' => $test->code,
                        'status' => 'Pending',
                    ];
                    $this->audit->record(
                        (string) $request->user()?->id,
                        'LAB_ORDER_CREATED',
                        'lab_orders',
                        $orderId,
                        ['queue_id' => $queue, 'visit_id' => $entry->visit_id, 'setup_lab_test_id' => $test->id],
                        $request->ip(),
                        (int) $entry->branch_id
                    );
                }

                $deferredForEmergency = $entry->priority === 'Emergency';
                $destination = $deferredForEmergency ? 'Consultation' : 'Laboratory';
                $routedQueue = $deferredForEmergency
                    ? (array) DB::table('patient_queue')->where('id', $queue)->first()
                    : $this->queue->route($queue, 'Laboratory', $this->moduleContext($request));

                return [
                    'orders' => $orders,
                    'queue' => $routedQueue,
                    'destination' => $destination,
                    'deferredForEmergency' => $deferredForEmergency,
                ];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function diagnosisCatalog(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.read')) {
            return $this->denied();
        }
        $search = trim((string) $request->query('search', ''));
        if ($search === '') {
            return response()->json(['success' => true, 'data' => []]);
        }

        $rows = DB::table('setup_icd11')
            ->where(function ($query) use ($search) {
                $query->where('title', 'like', '%'.$search.'%')->orWhere('code', 'like', '%'.$search.'%');
            })
            ->orderBy('title')
            ->limit(30)
            ->get(['id', 'code', 'title', 'chapter']);

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function saveNotes(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.write')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'subjective' => ['present', 'nullable', 'string', 'max:20000'],
            'objective' => ['present', 'nullable', 'string', 'max:20000'],
            'assessment' => ['present', 'nullable', 'string', 'max:20000'],
            'plan' => ['present', 'nullable', 'string', 'max:20000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($queue, $request, $validator) {
                $entry = $this->queueEntry($queue);
                $consultation = DB::table('consultations')->where('patient_id', $entry->patient_id)
                    ->where('visit_id', $entry->visit_id)->orderByDesc('timestamp_value')->first();

                if (! $consultation) {
                    $consultationId = 'CON-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                    DB::table('consultations')->insert([
                        'id' => $consultationId,
                        'patient_id' => $entry->patient_id,
                        'patient_name' => $entry->patient_name,
                        'doctor_name' => $request->user()?->full_name,
                        'timestamp_value' => now(),
                        'payment_scheme' => $entry->payment_method,
                        'consultation_type' => $entry->consultation_type,
                        'consultation_fee' => $entry->consultation_fee,
                        'patient_sub_category' => $entry->patient_sub_category,
                        'branch_id' => $entry->branch_id,
                        'visit_id' => $entry->visit_id,
                        'status' => 'Draft',
                    ]);
                } else {
                    $consultationId = (string) $consultation->id;
                }

                $notes = $validator->validated();
                DB::table('consultations')->where('id', $consultationId)->update([
                    'history_of_present_illness' => $notes['subjective'],
                    'examination_findings' => $notes['objective'],
                    'provisional_diagnosis' => $notes['assessment'],
                    'management_plan' => $notes['plan'],
                ]);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'CONSULTATION_NOTES_SAVED',
                    'consultations',
                    $consultationId,
                    ['queue_id' => $queue, 'visit_id' => $entry->visit_id, 'status' => 'Draft'],
                    $request->ip(),
                    (int) $entry->branch_id
                );

                return ['consultationId' => $consultationId, 'status' => 'Draft'];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function addDiagnosis(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'consultation.write')) {
            return $this->denied();
        }
        $validator = Validator::make($request->all(), [
            'catalogId' => ['required', 'integer', 'min:1'],
            'type' => ['required', 'in:Primary,Secondary'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($queue, $request, $validator) {
                $entry = $this->queueEntry($queue);
                $catalog = DB::table('setup_icd11')->where('id', $validator->validated()['catalogId'])->first();
                if (! $catalog) {
                    throw new RuntimeException('The selected diagnosis is no longer available in the diagnosis catalogue.', 422);
                }

                $consultation = DB::table('consultations')->where('patient_id', $entry->patient_id)
                    ->where('visit_id', $entry->visit_id)->orderByDesc('timestamp_value')->first();
                if (! $consultation) {
                    $consultationId = 'CON-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                    DB::table('consultations')->insert([
                        'id' => $consultationId,
                        'patient_id' => $entry->patient_id,
                        'patient_name' => $entry->patient_name,
                        'doctor_name' => $request->user()?->full_name,
                        'timestamp_value' => now(),
                        'chief_complaint' => null,
                        'payment_scheme' => $entry->payment_method,
                        'consultation_type' => $entry->consultation_type,
                        'consultation_fee' => $entry->consultation_fee,
                        'patient_sub_category' => $entry->patient_sub_category,
                        'branch_id' => $entry->branch_id,
                        'visit_id' => $entry->visit_id,
                        'status' => 'Draft',
                    ]);
                    $consultation = DB::table('consultations')->where('id', $consultationId)->first();
                }

                if ($validator->validated()['type'] === 'Primary' &&
                    DB::table('consultation_diagnoses')->where('consultation_id', $consultation->id)->where('diagnosis_type', 'Primary')->exists()) {
                    throw new RuntimeException('This encounter already has a primary diagnosis. Add this as a secondary diagnosis or update the existing one.', 422);
                }

                $diagnosisId = DB::table('consultation_diagnoses')->insertGetId([
                    'consultation_id' => $consultation->id,
                    'patient_id' => $entry->patient_id,
                    'visit_id' => $entry->visit_id,
                    'icd11_id' => $catalog->id,
                    'diagnosis_code' => $catalog->code,
                    'diagnosis_title' => $catalog->title,
                    'diagnosis_type' => $validator->validated()['type'],
                    'created_at' => now(),
                ]);
                $diagnosis = [
                    'id' => $diagnosisId,
                    'code' => $catalog->code,
                    'title' => $catalog->title,
                    'type' => $validator->validated()['type'],
                ];
                $this->audit->record(
                    (string) $request->user()?->id,
                    'CONSULTATION_DIAGNOSIS_ADDED',
                    'consultation_diagnoses',
                    (string) $diagnosisId,
                    ['queue_id' => $queue, 'consultation_id' => $consultation->id, 'visit_id' => $entry->visit_id],
                    $request->ip(),
                    (int) $entry->branch_id
                );

                return ['consultationId' => $consultation->id, 'diagnosis' => $diagnosis];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    private function queueEntry(string $queue): object
    {
        $entry = DB::table('patient_queue as q')
            ->join('patients as p', 'p.id', '=', 'q.patient_id')
            ->where('q.id', $queue)
            ->where('q.current_station', 'Consultation')
            ->select('q.*', 'p.age', 'p.dob', 'p.gender', 'p.phone', 'p.blood_group', 'p.allergies')
            ->first();

        if (! $entry) {
            throw new RuntimeException('This visit is not currently waiting in the Consultation queue.', 404);
        }

        return $entry;
    }

    private function error(RuntimeException $exception): JsonResponse
    {
        $code = (int) $exception->getCode();
        return response()->json(
            ['success' => false, 'error' => $exception->getMessage()],
            $code >= 400 && $code <= 599 ? $code : 422
        );
    }
}
