<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;

class InpatientController extends Controller
{
    use GuardsPatientModule;

    public function __construct(private AuditService $audit, private VisitService $visits) {}

    public function admissionRequests(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.admissions.read')) {
            return $this->denied();
        }

        $rows = DB::table('consultation_dispositions as d')
            ->join('patient_queue as q', 'q.id', '=', 'd.queue_id')
            ->join('patients as p', 'p.id', '=', 'd.patient_id')
            ->where('d.outcome', 'Admission')
            ->where('d.status', 'Admission Requested')
            ->orderByRaw("CASE WHEN d.urgency = 'Emergency' THEN 0 WHEN d.urgency = 'Urgent' THEN 1 ELSE 2 END")
            ->orderBy('d.decided_at')
            ->get([
                'd.id',
                'd.queue_id',
                'd.patient_id',
                'd.visit_id',
                'd.reason',
                'd.urgency',
                'd.decided_by',
                'd.decided_at',
                'q.ticket_number',
                'q.current_station',
                'q.priority',
                'p.full_name as patient_name',
                'p.age',
                'p.gender',
                'p.phone',
            ]);

        return response()->json(['success' => true, 'data' => $rows->map(fn ($row) => [
            'id' => (string) $row->id,
            'queueId' => (string) $row->queue_id,
            'ticketNumber' => (string) $row->ticket_number,
            'patientId' => (string) $row->patient_id,
            'patientName' => (string) $row->patient_name,
            'visitId' => (string) $row->visit_id,
            'age' => $row->age,
            'gender' => $row->gender,
            'phone' => $row->phone,
            'reason' => $row->reason,
            'urgency' => $row->urgency,
            'requestedBy' => $row->decided_by,
            'requestedAt' => $row->decided_at,
            'queueStation' => $row->current_station,
        ])->values()]);
    }

    public function availableBeds(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.beds.read')) {
            return $this->denied();
        }

        $beds = DB::table('setup_bed_items as b')
            ->where(function ($query) {
                $query->whereNull('b.status')
                    ->orWhereRaw("TRIM(b.status) = ''")
                    ->orWhereRaw('LOWER(TRIM(b.status)) = ?', ['available']);
            })
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')->from('admissions as a')
                    ->whereColumn('a.setup_bed_id', 'b.id')
                    ->whereIn('a.status', ['Admitted', 'Discharge Pending']);
            })
            ->orderBy('b.ward_name')
            ->orderBy('b.bed_number')
            ->selectRaw("
                b.id,
                b.bed_number,
                COALESCE(
                    (SELECT w.id FROM wards w WHERE w.id = b.ward_id LIMIT 1),
                    (SELECT w.id FROM wards w WHERE LOWER(TRIM(w.name)) = LOWER(TRIM(b.ward_name)) LIMIT 1)
                ) AS resolved_ward_id,
                COALESCE(
                    (SELECT w.name FROM wards w WHERE w.id = b.ward_id LIMIT 1),
                    (SELECT w.name FROM wards w WHERE LOWER(TRIM(w.name)) = LOWER(TRIM(b.ward_name)) LIMIT 1),
                    b.ward_name
                ) AS resolved_ward_name,
                b.bed_type,
                b.cash_daily_rate,
                b.bed_charge
            ")
            ->get()
            ->filter(fn ($bed) => $bed->resolved_ward_id !== null && trim((string) $bed->resolved_ward_name) !== '')
            ->values();

        return response()->json(['success' => true, 'data' => $beds->map(fn ($bed) => [
            'id' => (int) $bed->id,
            'bedNumber' => (string) ($bed->bed_number ?? ''),
            'wardId' => (string) $bed->resolved_ward_id,
            'wardName' => (string) $bed->resolved_ward_name,
            'bedType' => $bed->bed_type,
            'dailyCharge' => (float) ($bed->bed_charge ?: $bed->cash_daily_rate ?: 0),
        ])->filter(fn ($bed) => $bed['wardId'] !== '' && $bed['wardName'] !== '')->values()]);
    }

    public function admissions(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.read')) {
            return $this->denied();
        }

        $rows = DB::table('admissions as a')
            ->leftJoin('wards as w', 'w.id', '=', 'a.ward_id')
            ->where('a.status', 'Admitted')
            ->orderBy('w.name')
            ->orderBy('a.bed_number')
            ->get([
                'a.id',
                'a.patient_id',
                'a.patient_name',
                'a.ward_id',
                'w.name as ward_name',
                'a.setup_bed_id',
                'a.bed_number',
                'a.admitted_date',
                'a.admitted_time',
                'a.admitting_doctor',
                'a.admitting_diagnosis',
                'a.visit_id',
            ]);

        return response()->json(['success' => true, 'data' => $rows->map(fn ($row) => [
            'id' => (string) $row->id,
            'patientId' => (string) $row->patient_id,
            'patientName' => (string) $row->patient_name,
            'wardId' => (string) $row->ward_id,
            'wardName' => (string) ($row->ward_name ?? ''),
            'bedId' => $row->setup_bed_id === null ? null : (int) $row->setup_bed_id,
            'bedNumber' => (string) ($row->bed_number ?? ''),
            'admittedAt' => trim((string) $row->admitted_date.' '.(string) $row->admitted_time),
            'admittingDoctor' => $row->admitting_doctor,
            'diagnosis' => $row->admitting_diagnosis,
            'visitId' => $row->visit_id,
        ])->values()]);
    }

    public function acceptAdmission(Request $request, string $disposition): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.admit')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'bedId' => ['required', 'integer', 'min:1'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $disposition, $validator) {
                $requestRow = DB::table('consultation_dispositions')->where('id', $disposition)->lockForUpdate()->first();
                if (! $requestRow || $requestRow->outcome !== 'Admission' || $requestRow->status !== 'Admission Requested') {
                    throw new RuntimeException('This admission request is no longer pending.', 409);
                }
                $queue = DB::table('patient_queue')->where('id', $requestRow->queue_id)->lockForUpdate()->first();
                if (! $queue || $queue->current_station !== 'Consultation') {
                    throw new RuntimeException('The patient is no longer waiting in Consultation. Refresh the request list before continuing.', 409);
                }

                $bed = DB::table('setup_bed_items')->where('id', $validator->validated()['bedId'])->lockForUpdate()->first();
                if (! $bed || (trim((string) $bed->status) !== '' && strcasecmp(trim((string) $bed->status), 'Available') !== 0)) {
                    throw new RuntimeException('The selected bed is not available. Refresh the bed list and choose another.', 409);
                }
                $ward = $bed->ward_id ? DB::table('wards')->where('id', $bed->ward_id)->first() : null;
                if (! $ward && trim((string) $bed->ward_name) !== '') {
                    $ward = DB::table('wards')
                        ->whereRaw('LOWER(TRIM(name)) = LOWER(TRIM(?))', [$bed->ward_name])
                        ->first();
                }
                if (! $ward) {
                    throw new RuntimeException('The selected bed is not linked to an active ward.', 422);
                }
                $occupied = DB::table('admissions')->where('setup_bed_id', $bed->id)
                    ->whereIn('status', ['Admitted', 'Discharge Pending'])->exists();
                if ($occupied) {
                    throw new RuntimeException('The selected bed has already been assigned. Refresh the bed list and choose another.', 409);
                }
                if (DB::table('admissions')->where('visit_id', $requestRow->visit_id)->whereIn('status', ['Admitted', 'Discharge Pending'])->exists()) {
                    throw new RuntimeException('This visit already has an active inpatient admission.', 409);
                }

                $patient = DB::table('patients')->where('id', $requestRow->patient_id)->lockForUpdate()->first();
                if (! $patient) {
                    throw new RuntimeException('The patient for this request could not be found.', 404);
                }
                $user = $request->user();
                $id = 'IPD-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                $admission = [
                    'id' => $id,
                    'patient_id' => $patient->id,
                    'patient_name' => $patient->full_name,
                    'patient_age' => $patient->age,
                    'patient_gender' => $patient->gender,
                    'ward_id' => $ward->id,
                    'bed_number' => $bed->bed_number,
                    'admitted_date' => now()->toDateString(),
                    'admitted_time' => now()->format('H:i:s'),
                    'admitting_doctor' => $user?->full_name ?? 'Inpatient Staff',
                    'admitting_diagnosis' => $requestRow->reason,
                    'insurance_provider' => $patient->insurance_provider,
                    'status' => 'Admitted',
                    'emergency_contact' => $patient->emergency_contact,
                    'emergency_phone' => $patient->emergency_phone,
                    'daily_bed_charge' => $bed->cash_daily_rate ?? 0,
                    'setup_bed_id' => $bed->id,
                    'branch_id' => $patient->branch_id ?? 1,
                    'visit_id' => $requestRow->visit_id,
                    'bed_charge' => $bed->bed_charge ?? $bed->cash_daily_rate ?? 0,
                    'nursing_care_charge' => $bed->nursing_care_charge ?? 0,
                    'meals_nutrition_charge' => $bed->meals_nutrition_charge ?? 0,
                    'daily_review_charge' => $bed->daily_review_charge ?? 0,
                ];
                DB::table('admissions')->insert($admission);
                DB::table('setup_bed_items')->where('id', $bed->id)->update(['status' => 'Occupied']);

                DB::table('consultation_dispositions')->where('id', $requestRow->id)->update([
                    'status' => 'Accepted',
                    'updated_at' => now(),
                ]);
                DB::table('patient_queue')->where('id', $requestRow->queue_id)->update([
                    'current_station' => 'Inpatient Ward',
                    'assigned_to' => 'Inpatient Ward',
                    'status' => 'Waiting',
                ]);
                DB::table('patient_visits')->where('id', $requestRow->visit_id)->update([
                    'visit_type' => 'Inpatient',
                    'encounter_type' => 'Inpatient',
                    'status' => 'In Progress',
                ]);
                DB::table('patients')->where('id', $patient->id)->update([
                    'status' => 'Admitted',
                    'current_bed' => $bed->bed_number,
                    'current_ward' => DB::table('wards')->where('id', $bed->ward_id)->value('name'),
                ]);
                $this->updateWardOccupancy((string) $ward->id);

                $context = $this->moduleContext($request);
                $this->audit->record(
                    (string) $user?->id,
                    'INPATIENT_ADMISSION_ACCEPTED',
                    'admissions',
                    $id,
                    ['disposition_id' => $requestRow->id, 'visit_id' => $requestRow->visit_id, 'bed_id' => $bed->id],
                    $request->ip(),
                    (int) $context['branch_id'],
                    [],
                    ['status' => 'Admitted', 'ward_id' => $ward->id, 'bed_number' => $bed->bed_number]
                );

                return [
                    'id' => $id,
                    'patientId' => (string) $patient->id,
                    'patientName' => (string) $patient->full_name,
                    'wardName' => (string) $ward->name,
                    'bedNumber' => (string) $bed->bed_number,
                    'status' => 'Admitted',
                ];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function declineAdmission(Request $request, string $disposition): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.admit')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $disposition, $validator) {
                $row = DB::table('consultation_dispositions')->where('id', $disposition)->lockForUpdate()->first();
                if (! $row || $row->outcome !== 'Admission' || $row->status !== 'Admission Requested') {
                    throw new RuntimeException('This admission request is no longer pending.', 409);
                }
                DB::table('consultation_dispositions')->where('id', $row->id)->update([
                    'status' => 'Declined',
                    'instructions' => $validator->validated()['reason'],
                    'updated_at' => now(),
                ]);
                $context = $this->moduleContext($request);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'INPATIENT_ADMISSION_DECLINED',
                    'consultation_dispositions',
                    (string) $row->id,
                    ['queue_id' => $row->queue_id, 'visit_id' => $row->visit_id],
                    $request->ip(),
                    (int) $context['branch_id'],
                    ['status' => 'Admission Requested'],
                    ['status' => 'Declined', 'reason' => $validator->validated()['reason']]
                );

                return ['id' => (string) $row->id, 'status' => 'Declined'];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function discharge(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.discharge')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'summary' => ['required', 'string', 'min:3', 'max:5000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $validator) {
                $row = DB::table('admissions')->where('id', $admission)->lockForUpdate()->first();
                if (! $row || $row->status !== 'Admitted') {
                    throw new RuntimeException('This inpatient admission is no longer active.', 409);
                }
                $summary = $validator->validated()['summary'];
                DB::table('admissions')->where('id', $row->id)->update([
                    'status' => 'Discharged',
                    'discharge_date' => now()->toDateString(),
                    'discharge_summary' => $summary,
                ]);
                if ($row->setup_bed_id && ! DB::table('admissions')->where('setup_bed_id', $row->setup_bed_id)
                    ->where('id', '!=', $row->id)->whereIn('status', ['Admitted', 'Discharge Pending'])->exists()) {
                    DB::table('setup_bed_items')->where('id', $row->setup_bed_id)->update(['status' => 'Available']);
                }
                DB::table('patients')->where('id', $row->patient_id)->update([
                    'status' => 'Active',
                    'current_bed' => null,
                    'current_ward' => null,
                ]);
                DB::table('patient_queue')->where('visit_id', $row->visit_id)->update([
                    'current_station' => 'Discharged',
                    'status' => 'Completed',
                    'assigned_to' => null,
                ]);
                $context = $this->moduleContext($request);
                $this->visits->close((string) $row->visit_id, $context);
                $this->updateWardOccupancy((string) $row->ward_id);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'INPATIENT_DISCHARGED',
                    'admissions',
                    (string) $row->id,
                    ['patient_id' => $row->patient_id, 'visit_id' => $row->visit_id],
                    $request->ip(),
                    (int) $context['branch_id'],
                    ['status' => 'Admitted'],
                    ['status' => 'Discharged']
                );

                return ['id' => (string) $row->id, 'status' => 'Discharged', 'visitId' => (string) $row->visit_id];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function clinicalChart(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.clinical.read')) {
            return $this->denied();
        }

        try {
            $row = $this->activeAdmission($admission);
        } catch (RuntimeException $exception) {
            return $this->runtimeError($exception);
        }

        $admissionNote = DB::table('admission_clinical_notes')->where('admission_id', $admission)
            ->orderByDesc('created_at')->first();

        return response()->json(['success' => true, 'data' => [
            'admission' => [
                'id' => (string) $row->id,
                'patientId' => (string) $row->patient_id,
                'patientName' => (string) $row->patient_name,
                'wardName' => (string) $row->ward_name,
                'bedNumber' => (string) $row->bed_number,
                'admittedAt' => trim((string) $row->admitted_date.' '.(string) $row->admitted_time),
                'diagnosis' => (string) ($row->admitting_diagnosis ?? ''),
                'status' => (string) $row->status,
            ],
            'admissionNotes' => $admissionNote ? [
                'id' => (string) $admissionNote->id,
                'chiefComplaint' => (string) ($admissionNote->chief_complaint ?? ''),
                'historyPresentIllness' => (string) ($admissionNote->history_present_illness ?? ''),
                'pastHistory' => (string) ($admissionNote->past_history ?? ''),
                'examination' => $this->storedText($admissionNote->examination_json),
                'preMedications' => $this->storedText($admissionNote->pre_medications_json),
                'tobaccoUse' => $admissionNote->tobacco_use,
                'alcoholUse' => $admissionNote->alcohol_use,
                'substanceNotes' => (string) ($admissionNote->substance_notes ?? ''),
                'primaryDiagnosis' => (string) ($admissionNote->primary_diagnosis ?? ''),
                'differentialDiagnoses' => (string) ($admissionNote->differential_diagnoses ?? ''),
                'orders' => $this->storedText($admissionNote->orders_json),
                'managementPlan' => (string) ($admissionNote->management_plan ?? ''),
                'clinicianName' => $admissionNote->clinician_name,
                'designation' => $admissionNote->designation,
                'status' => (string) ($admissionNote->status ?? 'Draft'),
                'signedAt' => $admissionNote->signed_at,
            ] : null,
            'doctorNotes' => DB::table('inpatient_doctor_notes')->where('admission_id', $admission)
                ->orderByDesc('noted_at')->limit(100)->get()->map(fn ($note) => [
                    'id' => (string) $note->id,
                    'clinician' => $note->clinician,
                    'icdCode' => $note->icd_code,
                    'diagnosis' => $note->diagnosis,
                    'subjective' => $note->subjective,
                    'objective' => $note->objective,
                    'assessment' => $note->assessment,
                    'plan' => $note->plan,
                    'notedAt' => $note->noted_at,
                ])->values(),
            'wardRounds' => DB::table('ward_round_notes')->where('admission_id', $admission)
                ->orderByDesc('timestamp_value')->limit(100)->get()->map(fn ($note) => [
                    'id' => (string) $note->id,
                    'doctorName' => $note->doctor_name,
                    'timestamp' => $note->timestamp_value,
                    'subjective' => $note->subjective,
                    'objective' => $note->objective,
                    'assessment' => $note->assessment,
                    'plan' => $note->plan,
                ])->values(),
            'vitals' => DB::table('inpatient_vitals')->where('admission_id', $admission)
                ->orderByDesc('recorded_at')->limit(200)->get()->map(fn ($vital) => [
                    'id' => (string) $vital->id,
                    'systolic' => $vital->systolic,
                    'diastolic' => $vital->diastolic,
                    'pulse' => $vital->pulse,
                    'temperature' => $vital->temperature,
                    'respiratoryRate' => $vital->respiratory_rate,
                    'spo2' => $vital->spo2,
                    'fbs' => $vital->fbs,
                    'rbs' => $vital->rbs,
                    'remarks' => $vital->remarks,
                    'recordedBy' => $vital->recorded_by,
                    'recordedAt' => $vital->recorded_at,
                ])->values(),
        ]]);
    }

    public function saveAdmissionNotes(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.admission-notes.write')) {
            return $this->denied();
        }
        $validator = Validator::make($request->all(), [
            'chiefComplaint' => ['required', 'string', 'min:3', 'max:5000'],
            'historyPresentIllness' => ['required', 'string', 'min:3', 'max:10000'],
            'pastHistory' => ['nullable', 'string', 'max:10000'],
            'examination' => ['required', 'string', 'min:3', 'max:10000'],
            'preMedications' => ['nullable', 'string', 'max:5000'],
            'tobaccoUse' => ['nullable', 'in:Yes,No,Unknown'],
            'alcoholUse' => ['nullable', 'in:Yes,No,Unknown'],
            'substanceNotes' => ['nullable', 'string', 'max:5000'],
            'primaryDiagnosis' => ['required', 'string', 'min:3', 'max:255'],
            'differentialDiagnoses' => ['nullable', 'string', 'max:5000'],
            'orders' => ['nullable', 'string', 'max:10000'],
            'managementPlan' => ['required', 'string', 'min:3', 'max:10000'],
            'designation' => ['nullable', 'string', 'max:150'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $validator) {
                $row = $this->activeAdmission($admission, true);
                $existing = DB::table('admission_clinical_notes')->where('admission_id', $admission)->lockForUpdate()->first();
                if ($existing && $existing->status === 'Signed') {
                    throw new RuntimeException('Admission notes are already signed. Add a doctor progress note for updates.', 409);
                }

                $data = $validator->validated();
                $id = $existing?->id ?? 'ACN-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                $values = [
                    'patient_id' => $row->patient_id,
                    'admission_id' => $admission,
                    'chief_complaint' => $data['chiefComplaint'],
                    'history_present_illness' => $data['historyPresentIllness'],
                    'past_history' => $data['pastHistory'] ?? null,
                    'examination_json' => json_encode(['summary' => $data['examination']], JSON_UNESCAPED_UNICODE),
                    'pre_medications_json' => json_encode(['summary' => $data['preMedications'] ?? ''], JSON_UNESCAPED_UNICODE),
                    'tobacco_use' => $data['tobaccoUse'] ?? null,
                    'alcohol_use' => $data['alcoholUse'] ?? null,
                    'substance_notes' => $data['substanceNotes'] ?? null,
                    'primary_diagnosis' => $data['primaryDiagnosis'],
                    'differential_diagnoses' => $data['differentialDiagnoses'] ?? null,
                    'orders_json' => json_encode(['summary' => $data['orders'] ?? ''], JSON_UNESCAPED_UNICODE),
                    'management_plan' => $data['managementPlan'],
                    'clinician_name' => $request->user()?->full_name,
                    'designation' => $data['designation'] ?? null,
                    'status' => 'Draft',
                    'created_by' => $request->user()?->full_name,
                    'updated_at' => now(),
                ];
                if ($existing) {
                    DB::table('admission_clinical_notes')->where('id', $existing->id)->update($values);
                } else {
                    $values['id'] = $id;
                    $values['created_at'] = now();
                    DB::table('admission_clinical_notes')->insert($values);
                }
                $this->auditClinical($request, 'INPATIENT_ADMISSION_NOTES_SAVED', 'admission_clinical_notes', (string) $id, $row);

                return ['id' => (string) $id, 'status' => 'Draft'];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function signAdmissionNotes(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.admission-notes.write')) {
            return $this->denied();
        }

        try {
            $result = DB::transaction(function () use ($request, $admission) {
                $row = $this->activeAdmission($admission, true);
                $note = DB::table('admission_clinical_notes')->where('admission_id', $admission)->lockForUpdate()->first();
                if (! $note) {
                    throw new RuntimeException('Save the admission notes before signing them.', 422);
                }
                if ($note->status === 'Signed') {
                    throw new RuntimeException('Admission notes are already signed.', 409);
                }
                if (trim((string) $note->chief_complaint) === '' || trim((string) $note->history_present_illness) === ''
                    || trim((string) $note->primary_diagnosis) === '' || trim((string) $note->management_plan) === '') {
                    throw new RuntimeException('Complete the required admission note fields before signing.', 422);
                }
                DB::table('admission_clinical_notes')->where('id', $note->id)->update([
                    'status' => 'Signed',
                    'signed_at' => now(),
                    'clinician_name' => $request->user()?->full_name,
                    'updated_at' => now(),
                ]);
                $this->auditClinical($request, 'INPATIENT_ADMISSION_NOTES_SIGNED', 'admission_clinical_notes', (string) $note->id, $row);

                return ['id' => (string) $note->id, 'status' => 'Signed'];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function saveDoctorNote(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.doctor-notes.write')) {
            return $this->denied();
        }
        $validator = Validator::make($request->all(), [
            'icdCode' => ['nullable', 'string', 'max:255'],
            'diagnosis' => ['required', 'string', 'min:3', 'max:5000'],
            'subjective' => ['required', 'string', 'min:3', 'max:10000'],
            'objective' => ['required', 'string', 'min:3', 'max:10000'],
            'assessment' => ['required', 'string', 'min:3', 'max:10000'],
            'plan' => ['required', 'string', 'min:3', 'max:10000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $validator) {
                $row = $this->activeAdmission($admission, true);
                $data = $validator->validated();
                $id = 'IDN-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                DB::table('inpatient_doctor_notes')->insert([
                    'id' => $id,
                    'patient_id' => $row->patient_id,
                    'admission_id' => $admission,
                    'clinician' => $request->user()?->full_name,
                    'icd_code' => $data['icdCode'] ?? null,
                    'diagnosis' => $data['diagnosis'],
                    'subjective' => $data['subjective'],
                    'objective' => $data['objective'],
                    'assessment' => $data['assessment'],
                    'plan' => $data['plan'],
                    'noted_at' => now(),
                ]);
                $this->auditClinical($request, 'INPATIENT_DOCTOR_NOTE_RECORDED', 'inpatient_doctor_notes', $id, $row);

                return ['id' => $id, 'notedAt' => now()->toDateTimeString()];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function saveWardRound(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.rounds.write')) {
            return $this->denied();
        }
        $validator = Validator::make($request->all(), [
            'subjective' => ['required', 'string', 'min:3', 'max:10000'],
            'objective' => ['required', 'string', 'min:3', 'max:10000'],
            'assessment' => ['required', 'in:Critical,Guarded,Stable,Improving'],
            'plan' => ['required', 'string', 'min:3', 'max:10000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $validator) {
                $row = $this->activeAdmission($admission, true);
                $data = $validator->validated();
                $id = 'WRN-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                DB::table('ward_round_notes')->insert([
                    'id' => $id,
                    'admission_id' => $admission,
                    'patient_id' => $row->patient_id,
                    'doctor_name' => $request->user()?->full_name,
                    'timestamp_value' => now(),
                    'subjective' => $data['subjective'],
                    'objective' => $data['objective'],
                    'assessment' => $data['assessment'],
                    'plan' => $data['plan'],
                    'branch_id' => $row->branch_id ?? 1,
                ]);
                $this->auditClinical($request, 'INPATIENT_WARD_ROUND_RECORDED', 'ward_round_notes', $id, $row);

                return ['id' => $id, 'timestamp' => now()->toDateTimeString()];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function saveInpatientVitals(Request $request, string $admission): JsonResponse
    {
        if (! $this->allowed($request->user(), 'inpatient.vitals.write')) {
            return $this->denied();
        }
        $validator = Validator::make($request->all(), [
            'systolic' => ['nullable', 'integer', 'between:40,300'],
            'diastolic' => ['nullable', 'integer', 'between:20,200'],
            'pulse' => ['nullable', 'integer', 'between:20,250'],
            'temperature' => ['nullable', 'numeric', 'between:25,45'],
            'respiratoryRate' => ['nullable', 'integer', 'between:4,80'],
            'spo2' => ['nullable', 'integer', 'between:40,100'],
            'fbs' => ['nullable', 'numeric', 'between:0,80'],
            'rbs' => ['nullable', 'numeric', 'between:0,80'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }
        $data = $validator->validated();
        if (count(array_filter($data, fn ($value) => $value !== null && $value !== '')) === 0) {
            return response()->json(['success' => false, 'error' => 'Record at least one vital sign or a clinical remark.'], 422);
        }
        if (isset($data['systolic'], $data['diastolic']) && $data['systolic'] <= $data['diastolic']) {
            return response()->json(['success' => false, 'error' => 'Systolic pressure must be greater than diastolic pressure.'], 422);
        }

        try {
            $result = DB::transaction(function () use ($request, $admission, $data) {
                $row = $this->activeAdmission($admission, true);
                $id = 'IPV-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
                DB::table('inpatient_vitals')->insert([
                    'id' => $id,
                    'patient_id' => $row->patient_id,
                    'admission_id' => $admission,
                    'systolic' => $data['systolic'] ?? null,
                    'diastolic' => $data['diastolic'] ?? null,
                    'pulse' => $data['pulse'] ?? null,
                    'temperature' => $data['temperature'] ?? null,
                    'respiratory_rate' => $data['respiratoryRate'] ?? null,
                    'spo2' => $data['spo2'] ?? null,
                    'fbs' => $data['fbs'] ?? null,
                    'rbs' => $data['rbs'] ?? null,
                    'remarks' => $data['remarks'] ?? null,
                    'recorded_by' => $request->user()?->full_name,
                    'recorded_at' => now(),
                ]);
                $this->auditClinical($request, 'INPATIENT_VITALS_RECORDED', 'inpatient_vitals', $id, $row);

                return ['id' => $id, 'recordedAt' => now()->toDateTimeString()];
            });
        } catch (RuntimeException $exception) {
            $code = (int) $exception->getCode();
            return response()->json(['success' => false, 'error' => $exception->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    private function activeAdmission(string $id, bool $lock = false): object
    {
        $query = DB::table('admissions as a')
            ->leftJoin('wards as w', 'w.id', '=', 'a.ward_id')
            ->where('a.id', $id)
            ->select('a.*', 'w.name as ward_name');
        if ($lock) {
            $query->lockForUpdate();
        }
        $row = $query->first();
        if (! $row) {
            throw new RuntimeException('Inpatient admission not found.', 404);
        }
        if ($row->status !== 'Admitted') {
            throw new RuntimeException('Clinical documentation is only available for an active inpatient admission.', 409);
        }

        return $row;
    }

    private function storedText(?string $value): string
    {
        if (! $value) {
            return '';
        }
        $decoded = json_decode($value, true);
        return is_array($decoded) ? (string) ($decoded['summary'] ?? '') : $value;
    }

    private function auditClinical(Request $request, string $action, string $entity, string $id, object $admission): void
    {
        $context = $this->moduleContext($request);
        $this->audit->record(
            (string) $request->user()?->id,
            $action,
            $entity,
            $id,
            ['admission_id' => $admission->id, 'patient_id' => $admission->patient_id],
            $request->ip(),
            (int) $context['branch_id']
        );
    }

    private function runtimeError(RuntimeException $exception): JsonResponse
    {
        $code = (int) $exception->getCode();
        return response()->json(
            ['success' => false, 'error' => $exception->getMessage()],
            $code >= 400 && $code <= 599 ? $code : 422
        );
    }

    private function updateWardOccupancy(string $wardId): void
    {
        $occupied = DB::table('admissions')->where('ward_id', $wardId)
            ->whereIn('status', ['Admitted', 'Discharge Pending'])->count();
        DB::table('wards')->where('id', $wardId)->update(['occupied_beds' => $occupied]);
    }
}
