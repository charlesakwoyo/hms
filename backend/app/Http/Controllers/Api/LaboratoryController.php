<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;

class LaboratoryController extends Controller
{
    use GuardsPatientModule;

    public function __construct(private AuditService $audit, private QueueService $queue) {}

    public function worklist(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'laboratory.read')) {
            return $this->denied();
        }

        $rows = DB::table('lab_orders as o')
            ->join('patient_queue as q', function ($join) {
                $join->on('q.patient_id', '=', 'o.patient_id')
                    ->on('q.visit_id', '=', 'o.visit_id');
            })
            ->where('q.current_station', 'Laboratory')
            ->whereNotIn('o.status', ['Verified', 'Completed', 'Cancelled', 'Canceled'])
            ->orderByRaw("CASE WHEN q.priority = 'Emergency' THEN 0 WHEN q.priority = 'Urgent' THEN 1 ELSE 2 END")
            ->orderBy('o.requested_at')
            ->limit(500)
            ->get([
                'o.id',
                'o.patient_id',
                'o.patient_name',
                'o.visit_id',
                'o.test_name',
                'o.setup_lab_test_code',
                'o.category',
                'o.sample_type',
                'o.clinical_indication',
                'o.status',
                'o.specimen_accession_no',
                'o.recollection_count',
                'o.rejection_reason',
                'o.result_value',
                'o.reference_range',
                'o.result_notes',
                'o.collected_by',
                'o.received_by',
                'o.sample_collected_at',
                'o.result_entered_by',
                'o.conducted_by',
                'o.completed_at',
                'o.verified_by',
                'o.verified_at',
                'o.requested_by',
                'o.requested_at',
                'q.ticket_number',
                'q.priority',
            ]);

        return response()->json([
            'success' => true,
            'data' => $rows->map(fn ($row) => [
                'orderId' => (string) $row->id,
                'patientId' => (string) $row->patient_id,
                'patientName' => (string) $row->patient_name,
                'visitId' => (string) $row->visit_id,
                'ticketNumber' => (string) $row->ticket_number,
                'testName' => $row->test_name,
                'testCode' => $row->setup_lab_test_code,
                'department' => $row->category,
                'specimenType' => $row->sample_type,
                'clinicalIndication' => $row->clinical_indication,
                'status' => $row->status,
                'accessionNo' => $row->specimen_accession_no,
                'recollectionCount' => (int) $row->recollection_count,
                'rejectionReason' => $row->rejection_reason,
                'resultValue' => $row->result_value,
                'referenceRange' => $row->reference_range,
                'resultNotes' => $row->result_notes,
                'collectedBy' => $row->collected_by,
                'receivedBy' => $row->received_by,
                'collectedAt' => $row->sample_collected_at,
                'resultEnteredBy' => $row->result_entered_by,
                'conductedBy' => $row->conducted_by,
                'completedAt' => $row->completed_at,
                'verifiedBy' => $row->verified_by,
                'verifiedAt' => $row->verified_at,
                'requestedBy' => $row->requested_by,
                'requestedAt' => $row->requested_at,
                'priority' => $row->priority,
            ])->values(),
        ]);
    }

    public function collect(Request $request, string $order): JsonResponse
    {
        if (! $this->allowed($request->user(), 'laboratory.collect')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'accessionNo' => ['nullable', 'string', 'max:80'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $data = DB::transaction(function () use ($request, $order, $validator) {
                $row = $this->lockedOrder($order);
                if (! in_array($row->status, ['Pending', 'Awaiting Recollection'], true)) {
                    throw new RuntimeException('Only a pending or recollection-requested order can have a specimen collected.', 422);
                }

                $accessionNo = trim((string) ($validator->validated()['accessionNo'] ?? ''));
                if ($accessionNo === '') {
                    $accessionNo = 'SPC-'.now()->format('Ymd').'-'.strtoupper(Str::random(8));
                }
                DB::table('lab_orders')->where('id', $order)->update([
                    'status' => 'Collected',
                    'specimen_accession_no' => $accessionNo,
                    'sample_collected_at' => now(),
                    'collected_by' => $request->user()?->full_name,
                    'received_by' => $request->user()?->full_name,
                    'rejection_reason' => null,
                    'rejected_by' => null,
                    'rejected_at' => null,
                    'recollection_count' => (int) $row->recollection_count + ($row->status === 'Awaiting Recollection' ? 1 : 0),
                ]);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'LAB_SPECIMEN_COLLECTED',
                    'lab_orders',
                    $order,
                    ['accession_no' => $accessionNo],
                    $request->ip(),
                    (int) $row->branch_id,
                    ['status' => $row->status],
                    ['status' => 'Collected', 'collected_by' => $request->user()?->full_name]
                );

                return ['orderId' => $order, 'accessionNo' => $accessionNo, 'status' => 'Collected'];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function rejectSpecimen(Request $request, string $order): JsonResponse
    {
        if (! $this->allowed($request->user(), 'laboratory.collect')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['required', 'string', 'min:3', 'max:2000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $data = DB::transaction(function () use ($request, $order, $validator) {
                $row = $this->lockedOrder($order);
                if ($row->status !== 'Collected') {
                    throw new RuntimeException('Only a collected specimen can be rejected.', 422);
                }
                $reason = trim($validator->validated()['reason']);
                DB::table('lab_orders')->where('id', $order)->update([
                    'status' => 'Awaiting Recollection',
                    'rejected_by' => $request->user()?->full_name,
                    'rejected_at' => now(),
                    'rejection_reason' => $reason,
                ]);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'LAB_SPECIMEN_REJECTED',
                    'lab_orders',
                    $order,
                    ['reason' => $reason],
                    $request->ip(),
                    (int) $row->branch_id,
                    ['status' => $row->status, 'accession_no' => $row->specimen_accession_no],
                    ['status' => 'Awaiting Recollection', 'rejected_by' => $request->user()?->full_name]
                );

                return ['orderId' => $order, 'status' => 'Awaiting Recollection'];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function enterResult(Request $request, string $order): JsonResponse
    {
        if (! $this->allowed($request->user(), 'laboratory.result')) {
            return $this->denied();
        }

        $validator = Validator::make($request->all(), [
            'resultValue' => ['required', 'string', 'max:20000'],
            'referenceRange' => ['nullable', 'string', 'max:180'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first()], 422);
        }

        try {
            $data = DB::transaction(function () use ($request, $order, $validator) {
                $row = $this->lockedOrder($order);
                if ($row->status !== 'Collected') {
                    throw new RuntimeException('A specimen must be collected before entering a result.', 422);
                }
                $notes = $validator->validated();
                DB::table('lab_orders')->where('id', $order)->update([
                    'status' => 'Result Entered',
                    'result_value' => trim($notes['resultValue']),
                    'reference_range' => $notes['referenceRange'] ?? null,
                    'result_notes' => $notes['notes'] ?? null,
                    'conducted_by' => $request->user()?->full_name,
                    'result_entered_by' => $request->user()?->full_name,
                    'completed_at' => now(),
                ]);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'LAB_RESULT_ENTERED',
                    'lab_orders',
                    $order,
                    [],
                    $request->ip(),
                    (int) $row->branch_id,
                    ['status' => $row->status],
                    ['status' => 'Result Entered', 'result_entered_by' => $request->user()?->full_name]
                );

                return ['orderId' => $order, 'status' => 'Result Entered'];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function verifyResult(Request $request, string $order): JsonResponse
    {
        if (! $this->allowed($request->user(), 'laboratory.verify')) {
            return $this->denied();
        }

        try {
            $data = DB::transaction(function () use ($request, $order) {
                $row = $this->lockedOrder($order);
                if ($row->status !== 'Result Entered') {
                    throw new RuntimeException('Only an entered result can be verified.', 422);
                }
                DB::table('lab_orders')->where('id', $order)->update([
                    'status' => 'Verified',
                    'verified_by' => $request->user()?->full_name,
                    'verified_at' => now(),
                ]);
                $this->audit->record(
                    (string) $request->user()?->id,
                    'LAB_RESULT_VERIFIED',
                    'lab_orders',
                    $order,
                    [],
                    $request->ip(),
                    (int) $row->branch_id,
                    ['status' => $row->status],
                    ['status' => 'Verified', 'verified_by' => $request->user()?->full_name]
                );

                $openOrdersRemain = DB::table('lab_orders')
                    ->where('patient_id', $row->patient_id)
                    ->where('visit_id', $row->visit_id)
                    ->whereNotIn('status', ['Verified', 'Cancelled', 'Canceled'])
                    ->exists();
                $destination = 'Laboratory';
                $queueEntry = DB::table('patient_queue')->where('id', $row->queue_id)->first();
                if (! $openOrdersRemain && $queueEntry?->current_station === 'Laboratory') {
                    $this->queue->route($row->queue_id, 'Consultation', $this->moduleContext($request));
                    $destination = 'Consultation';
                }

                return [
                    'orderId' => $order,
                    'status' => 'Verified',
                    'destination' => $destination,
                    'returnedToConsultation' => $destination === 'Consultation',
                ];
            });
        } catch (RuntimeException $exception) {
            return $this->error($exception);
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    private function lockedOrder(string $order): object
    {
        $row = DB::table('lab_orders as o')
            ->join('patient_queue as q', function ($join) {
                $join->on('q.patient_id', '=', 'o.patient_id')->on('q.visit_id', '=', 'o.visit_id');
            })
            ->where('o.id', $order)
            ->where('q.current_station', 'Laboratory')
            ->select('o.*', 'q.id as queue_id')
            ->lockForUpdate()
            ->first();

        if (! $row) {
            throw new RuntimeException('This laboratory order is not in the active Laboratory queue.', 404);
        }

        return $row;
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
