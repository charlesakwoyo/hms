<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class QueueService
{
    private const KNOWN_FIELDS = [
        'id', 'ticketNumber', 'patientId', 'patientName', 'arrivedTime', 'currentStation', 'priority',
        'assignedTo', 'paymentMethod', 'consultationFeePaid', 'status', 'callCount', 'lastCalledAt',
        'servicePointNote', 'consultationServiceId', 'consultationServiceCode', 'consultationType',
        'consultationFee', 'patientCategory', 'patientSubCategory', 'consultationServiceName', 'consultationPriceSource',
        'freeConsultation', 'freeConsultationAllowedBy', 'referredDepartment', 'referredConsultationServiceId',
        'referredConsultationServiceCode', 'referredConsultationType', 'referredConsultationFee',
        'visitId', 'schemeId', 'branchId', 'departmentId', 'emergency', 'appointmentId', 'source', 'notes',
    ];

    private const STATION_STAFF = [
        'Billing' => 'Cashier',
        'Triage' => 'Triage Nurse',
        'Consultation' => 'Consulting Doctor',
        'Laboratory' => 'Laboratory',
        'Radiology' => 'Radiology',
        'Pharmacy' => 'Pharmacy',
        'Inpatient Ward' => 'Inpatient Ward',
    ];

    public function __construct(
        private SequenceService $sequences,
        private BranchService $branches,
        private AuditService $audit,
        private WorkflowService $workflow
    ) {}

    public function status(string $patientId): ?array
    {
        $row = DB::table('patient_queue')->where('patient_id', $patientId)
            ->whereNotIn('current_station', ['Discharged'])
            ->orderByDesc('arrived_time')->first();

        return $row ? (array) $row : null;
    }

    public function create(string $patientId, array $data, array $context = []): array
    {
        $this->assertKnownFields($data);

        return DB::transaction(function () use ($patientId, $data, $context) {
            $patient = DB::table('patients')->where('id', $patientId)->first();
            if (! $patient) {
                throw new RuntimeException('Patient not found.', 404);
            }

            $visitId = (string) ($data['visitId'] ?? '');
            $visit = DB::table('patient_visits')->where('id', $visitId)->where('patient_id', $patientId)->first();
            if (! $visit) {
                throw new RuntimeException('Visit not found for this patient.', 422);
            }

            $existing = $this->activeQueue($patientId, $visitId);
            if ($existing) {
                throw new RuntimeException('This patient already has an active queue entry.', 409);
            }

            $branchId = $this->branches->resolve($data['branchId'] ?? ($context['branch_id'] ?? $patient->branch_id));
            $paymentMethod = trim((string) ($data['paymentMethod'] ?? $patient->insurance_provider ?? 'Cash / M-Pesa'));
            $fee = round((float) ($data['consultationFee'] ?? 0), 2);
            $requestedPriority = $data['priority'] ?? 'Normal';
            $priority = in_array($requestedPriority, ['Normal', 'Urgent', 'Emergency'], true) ? $requestedPriority : 'Normal';
            $cash = $this->isCash($paymentMethod);
            if ($cash) {
                $fee = $this->configuredCashFee(
                    (int) ($data['consultationServiceId'] ?? 0),
                    $fee
                );
            }
            $free = $cash ? $fee <= 0 : (! empty($data['freeConsultation']) || $fee <= 0);
            $alreadyPaid = ! $cash && ! empty($data['consultationFeePaid']);
            $emergency = $priority === 'Emergency' || ! empty($data['emergency']);
            if ($emergency) {
                $priority = 'Emergency';
            }

            $route = $this->routeFor($data, $visit, $patient);
            $destination = 'Triage';
            $workflowCode = $route['workflow_code'] ?? 'CONSULTATION';
            $prefix = $destination === 'Billing' ? 'B-' : 'T-';
            $ticket = $this->sequences->next(config('patients.sequences.queue', 'QUEUE'), $prefix);
            $id = 'Q-'.now()->format('YmdHis').'-'.Str::lower(Str::random(6));
            $subCategory = $data['patientSubCategory'] ?? null;
            if (! $subCategory && $patient->patient_sub_category_id) {
                $subCategory = DB::table('setup_patient_subcategories')->where('id', $patient->patient_sub_category_id)->value('name');
            }

            $row = [
                'id' => $id,
                'ticket_number' => $ticket,
                'patient_id' => $patientId,
                'patient_name' => (string) $patient->full_name,
                'arrived_time' => now(),
                'current_station' => $destination,
                'priority' => $priority,
                'assigned_to' => self::STATION_STAFF[$destination] ?? null,
                'payment_method' => $paymentMethod,
                'consultation_fee_paid' => ($free || $alreadyPaid || ! $cash) ? 1 : 0,
                'status' => 'Waiting',
                'call_count' => 0,
                'service_point_note' => $data['servicePointNote'] ?? $this->noteFor($destination, $free, $cash),
                'consultation_service_id' => $data['consultationServiceId'] ?? null,
                'consultation_service_code' => $data['consultationServiceCode'] ?? null,
                'consultation_type' => $data['consultationType'] ?? $data['consultationServiceName'] ?? null,
                'consultation_fee' => $fee,
                'patient_sub_category' => $subCategory,
                'scheme_id' => $data['schemeId'] ?? $patient->scheme_id,
                'branch_id' => $branchId,
                'visit_id' => $visitId,
            ];

            DB::table('patient_queue')->insert($row);

            $this->audit->record(
                $context['actor_id'] ?? null,
                'QUEUE_ENTRY_CREATED',
                'patient_queue',
                $id,
                ['destination' => $destination, 'ticket_number' => $ticket],
                $context['ip'] ?? null,
                $branchId,
                [],
                $row
            );
            $this->workflow->record(
                $patientId,
                'patient_queue',
                $id,
                (string) $workflowCode,
                'Registration',
                $destination,
                'QUEUE_CREATED',
                $context,
                $row['service_point_note']
            );

            return ['id' => $id, 'ticketNumber' => $ticket, 'destination' => $destination, 'data' => (array) DB::table('patient_queue')->where('id', $id)->first()];
        });
    }

    public function route(string $queueId, string $station, array $context = []): array
    {
        if (! in_array($station, config('patients.stations', []), true)) {
            throw new RuntimeException('Unknown queue station.', 422);
        }

        return DB::transaction(function () use ($queueId, $station, $context) {
            $before = DB::table('patient_queue')->where('id', $queueId)->first();
            if (! $before) {
                throw new RuntimeException('Queue entry not found.', 404);
            }
            if ($before->current_station === 'Inpatient Ward') {
                throw new RuntimeException('Inpatient queue entries can only be moved through the inpatient admission and discharge workflow.', 422);
            }
            if ($station === 'Discharged') {
                throw new RuntimeException('Discharge is unavailable until the clinical care workflow confirms the patient is ready.', 422);
            }
            if ($station === 'Inpatient Ward') {
                throw new RuntimeException('Patients can only enter Inpatient after an admission request is accepted and a bed is assigned.', 422);
            }
            if (
                $before->current_station === 'Triage'
                && in_array($station, ['Billing', 'Consultation'], true)
                && ! $this->hasTriageAssessment($before)
            ) {
                throw new RuntimeException('Record the triage assessment before routing this patient onward.', 422);
            }
            if (
                $before->current_station === 'Triage'
                && $this->isCash((string) $before->payment_method)
                && ! (bool) $before->consultation_fee_paid
                && $before->priority !== 'Emergency'
                && $station !== 'Billing'
            ) {
                throw new RuntimeException('Complete triage, then route this unpaid cash patient to Billing before Consultation.', 422);
            }
            if (
                $before->current_station === 'Triage'
                && $station === 'Billing'
                && (! $this->isCash((string) $before->payment_method) || (bool) $before->consultation_fee_paid)
            ) {
                throw new RuntimeException('Only an unpaid cash consultation should be routed from Triage to Billing.', 422);
            }
            if (
                $before->current_station === 'Billing'
                && $this->isCash((string) $before->payment_method)
                && ! (bool) $before->consultation_fee_paid
                && $station !== 'Billing'
            ) {
                throw new RuntimeException('Record and confirm the consultation payment before routing this cash patient from Billing.', 422);
            }
            if ($before->current_station === 'Billing' && $station !== 'Consultation') {
                throw new RuntimeException('After consultation payment, route the patient to Consultation. Other services require a clinician order.', 422);
            }
            if (in_array($station, ['Laboratory', 'Radiology', 'Pharmacy'], true) && ! $this->hasCareOrder($before, $station)) {
                throw new RuntimeException('This service cannot be added to the queue until a clinician places the corresponding order.', 422);
            }

            $changes = [
                'current_station' => $station,
                'assigned_to' => self::STATION_STAFF[$station] ?? $before->assigned_to,
                'status' => $before->status ?: 'Waiting',
            ];
            DB::table('patient_queue')->where('id', $queueId)->update($changes);
            $after = DB::table('patient_queue')->where('id', $queueId)->first();

            $this->audit->record(
                $context['actor_id'] ?? null,
                'QUEUE_ROUTE_CHANGED',
                'patient_queue',
                $queueId,
                ['visit_id' => $before->visit_id],
                $context['ip'] ?? null,
                (int) ($context['branch_id'] ?? $before->branch_id ?? 1),
                ['current_station' => $before->current_station, 'assigned_to' => $before->assigned_to],
                ['current_station' => $after->current_station, 'assigned_to' => $after->assigned_to]
            );
            $this->workflow->record(
                (string) $before->patient_id,
                'patient_queue',
                $queueId,
                'CONSULTATION',
                $before->current_station,
                $station,
                'QUEUE_ROUTE_CHANGED',
                $context
            );

            return (array) $after;
        });
    }

    public function recordConsultationPayment(string $queueId, array $payment, array $context = []): array
    {
        return DB::transaction(function () use ($queueId, $payment, $context) {
            $queue = DB::table('patient_queue')->where('id', $queueId)->lockForUpdate()->first();
            if (! $queue) {
                throw new RuntimeException('Queue entry not found.', 404);
            }
            if ($queue->current_station !== 'Billing') {
                throw new RuntimeException('Consultation payment can only be recorded while the patient is at Billing.', 422);
            }
            if (! $this->isCash((string) $queue->payment_method)) {
                throw new RuntimeException('This queue entry is not a cash consultation.', 422);
            }
            if ((bool) $queue->consultation_fee_paid) {
                throw new RuntimeException('Consultation payment has already been recorded.', 409);
            }

            $patient = DB::table('patients')->where('id', $queue->patient_id)->first();
            $visit = DB::table('patient_visits')->where('id', $queue->visit_id)
                ->where('patient_id', $queue->patient_id)->first();
            if (! $patient || ! $visit) {
                throw new RuntimeException('The patient visit linked to this queue entry could not be found.', 422);
            }

            $fee = $this->configuredCashFee(
                (int) $queue->consultation_service_id,
                (float) $queue->consultation_fee
            );
            if ($fee <= 0) {
                throw new RuntimeException('No payable consultation fee is configured for this service.', 422);
            }

            $service = DB::table('setup_consultation_services')->where('id', $queue->consultation_service_id)->first();
            $branchId = (int) ($queue->branch_id ?: $this->branches->resolve($patient->branch_id));
            $invoiceId = 'INV-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
            $method = (string) $payment['paymentMethod'];
            $reference = trim((string) ($payment['reference'] ?? '')) ?: null;
            $cashierName = (string) ($context['actor_name'] ?? 'Cashier');
            $now = now();

            DB::table('invoices')->insert([
                'id' => $invoiceId,
                'patient_id' => $queue->patient_id,
                'patient_name' => $patient->full_name,
                'patient_phone' => $patient->phone,
                'invoice_date' => $now->toDateString(),
                'subtotal' => $fee,
                'discount' => 0,
                'tax' => 0,
                'total_amount' => $fee,
                'amount_paid' => $fee,
                'balance' => 0,
                'payment_method' => $method,
                'payment_reference' => $reference,
                'status' => 'Paid',
                'cashier_name' => $cashierName,
                'billing_payer' => 'Cash / M-Pesa',
                'insurance_provider' => $queue->payment_method,
                'scheme_id' => $queue->scheme_id,
                'branch_id' => $branchId,
                'visit_id' => $queue->visit_id,
                'invoice_type' => 'OPD',
                'created_at' => $now,
            ]);
            DB::table('invoice_items')->insert([
                'invoice_id' => $invoiceId,
                'description' => $queue->consultation_type ?: ($service->name ?? 'Consultation'),
                'category' => 'Consultation',
                'unit_cost' => $fee,
                'quantity' => 1,
                'total' => $fee,
                'setup_entity_type' => 'setup-consultation-services',
                'setup_entity_id' => $queue->consultation_service_id,
                'source_entity' => 'patient_queue',
                'source_id' => $queueId,
                'payer' => 'Patient',
                'branch_id' => $branchId,
                'is_paid' => 1,
                'paid_at' => $now,
            ]);
            DB::table('invoice_payment_splits')->insert([
                'invoice_id' => $invoiceId,
                'payment_method' => $method,
                'amount' => $fee,
                'reference' => $reference,
                'branch_id' => $branchId,
            ]);

            $mapping = $this->routeFor(
                ['consultationServiceId' => $queue->consultation_service_id],
                $visit,
                $patient
            );
            $destination = $this->careStation();
            $note = sprintf('Consultation payment %s recorded by %s. Proceed to %s.', $invoiceId, $cashierName, $destination);

            DB::table('patient_queue')->where('id', $queueId)->update([
                'consultation_fee' => $fee,
                'consultation_fee_paid' => 1,
                'current_station' => $destination,
                'assigned_to' => self::STATION_STAFF[$destination] ?? null,
                'service_point_note' => $note,
                'status' => 'Waiting',
            ]);

            $after = DB::table('patient_queue')->where('id', $queueId)->first();
            $this->audit->record(
                $context['actor_id'] ?? null,
                'CONSULTATION_PAYMENT_RECORDED',
                'invoices',
                $invoiceId,
                ['queue_id' => $queueId, 'amount' => $fee, 'payment_method' => $method, 'reference' => $reference],
                $context['ip'] ?? null,
                $branchId,
                ['consultation_fee_paid' => 0, 'current_station' => 'Billing'],
                ['consultation_fee_paid' => 1, 'current_station' => $destination]
            );
            $this->workflow->record(
                (string) $queue->patient_id,
                'patient_queue',
                $queueId,
                (string) ($mapping['workflow_code'] ?? 'CONSULTATION'),
                'Billing',
                $destination,
                'CONSULTATION_PAYMENT_CONFIRMED',
                $context,
                $note
            );

            return [
                'invoiceId' => $invoiceId,
                'destination' => $destination,
                'data' => (array) $after,
            ];
        });
    }

    public function continueAfterPayment(string $queueId, array $context = []): array
    {
        return DB::transaction(function () use ($queueId, $context) {
            $queue = DB::table('patient_queue')->where('id', $queueId)->lockForUpdate()->first();
            if (! $queue) {
                throw new RuntimeException('Queue entry not found.', 404);
            }
            if ($queue->current_station !== 'Billing' || ! $this->isCash((string) $queue->payment_method)) {
                throw new RuntimeException('This action is only for a cash patient currently at Billing.', 422);
            }
            if (! (bool) $queue->consultation_fee_paid) {
                throw new RuntimeException('Record and confirm payment before continuing to care.', 422);
            }

            $hasPaidInvoice = DB::table('invoices')
                ->join('invoice_items', 'invoice_items.invoice_id', '=', 'invoices.id')
                ->where('invoices.patient_id', $queue->patient_id)
                ->where('invoices.visit_id', $queue->visit_id)
                ->where('invoices.status', 'Paid')
                ->where('invoice_items.source_entity', 'patient_queue')
                ->where('invoice_items.source_id', $queueId)
                ->exists();
            if (! $hasPaidInvoice) {
                throw new RuntimeException('A paid invoice for this queue entry was not found. Ask the cashier to verify payment.', 422);
            }

            $patient = DB::table('patients')->where('id', $queue->patient_id)->first();
            $visit = DB::table('patient_visits')->where('id', $queue->visit_id)
                ->where('patient_id', $queue->patient_id)->first();
            if (! $patient || ! $visit) {
                throw new RuntimeException('The patient visit linked to this queue entry could not be found.', 422);
            }

            $mapping = $this->routeFor(
                ['consultationServiceId' => $queue->consultation_service_id],
                $visit,
                $patient
            );
            $destination = $this->careStation();
            $note = sprintf('Payment is confirmed. Continue to %s.', $destination);
            $beforeStation = (string) $queue->current_station;

            DB::table('patient_queue')->where('id', $queueId)->update([
                'current_station' => $destination,
                'assigned_to' => self::STATION_STAFF[$destination] ?? null,
                'service_point_note' => $note,
                'status' => 'Waiting',
            ]);
            $after = DB::table('patient_queue')->where('id', $queueId)->first();

            $this->audit->record(
                $context['actor_id'] ?? null,
                'QUEUE_CONTINUED_AFTER_PAYMENT',
                'patient_queue',
                $queueId,
                ['destination' => $destination],
                $context['ip'] ?? null,
                (int) ($context['branch_id'] ?? $queue->branch_id ?? 1),
                ['current_station' => $beforeStation],
                ['current_station' => $destination]
            );
            $this->workflow->record(
                (string) $queue->patient_id,
                'patient_queue',
                $queueId,
                (string) ($mapping['workflow_code'] ?? 'CONSULTATION'),
                $beforeStation,
                $destination,
                'QUEUE_CONTINUED_AFTER_PAYMENT',
                $context,
                $note
            );

            return ['destination' => $destination, 'data' => (array) $after];
        });
    }

    private function activeQueue(string $patientId, ?string $visitId = null)
    {
        $query = DB::table('patient_queue')->where('patient_id', $patientId)
            ->whereNotIn('current_station', ['Discharged'])
            ->where('arrived_time', '>=', now()->subDay());
        if ($visitId) {
            $query->where('visit_id', $visitId);
        }

        return $query->first();
    }

    private function routeFor(array $data, object $visit, object $patient): array
    {
        $mapping = null;
        $sources = [];
        if (! empty($data['consultationServiceId'])) {
            $sources[] = ['setup-consultation-services', $data['consultationServiceId']];
        }

        if (! empty($data['departmentId']) || $visit->department_id) {
            $sources[] = ['setup-departments', $data['departmentId'] ?? $visit->department_id];
        }
        if (! empty($patient->patient_sub_category_id)) {
            $sources[] = ['setup-patient-subcategories', $patient->patient_sub_category_id];
        }
        if (! empty($patient->scheme_id)) {
            $sources[] = ['setup-patient-schemes', $patient->scheme_id];
        }

        foreach ($sources as [$entity, $id]) {
            $mapping = DB::table('setup_workflow_mappings')->where('source_entity', $entity)->where('source_id', $id)
                ->where('active', 1)->orderByDesc('id')->first();
            if ($mapping) {
                break;
            }
        }

        $station = $mapping?->execution_station;
        if (! in_array($station, config('patients.stations', []), true)) {
            $station = null;
        }

        return ['station' => $station, 'workflow_code' => $mapping?->workflow_code ?? 'CONSULTATION'];
    }

    private function configuredCashFee(int $serviceId, float $submittedFee): float
    {
        if ($serviceId <= 0) {
            throw new RuntimeException('Select a consultation service before sending a cash patient to Billing.', 422);
        }

        $service = DB::table('setup_consultation_services')->where('id', $serviceId)->first();
        if (! $service || strtolower((string) ($service->status ?? 'active')) === 'inactive') {
            throw new RuntimeException('The selected consultation service is unavailable.', 422);
        }

        $configured = $service->cash_price !== null ? (float) $service->cash_price : null;
        if ($configured === null) {
            throw new RuntimeException('Configure a cash price for this consultation before queuing the patient.', 422);
        }

        $configured = round($configured, 2);
        if (abs(round($submittedFee, 2) - $configured) > 0.001) {
            throw new RuntimeException('The consultation price changed. Refresh the queue and confirm the current price.', 422);
        }

        return $configured;
    }

    private function careStation(): string
    {
        return 'Consultation';
    }

    private function hasCareOrder(object $queue, string $station): bool
    {
        $table = match ($station) {
            'Laboratory' => 'lab_orders',
            'Radiology' => 'radiology_orders',
            'Pharmacy' => 'prescriptions',
            default => null,
        };
        if ($table === null || ! DB::getSchemaBuilder()->hasTable($table)) {
            return false;
        }

        return DB::table($table)
            ->where('patient_id', $queue->patient_id)
            ->where('visit_id', $queue->visit_id)
            ->whereNotIn('status', ['Cancelled', 'Canceled', 'Rejected'])
            ->exists();
    }

    private function hasTriageAssessment(object $queue): bool
    {
        if (! DB::getSchemaBuilder()->hasTable('vitals_triage')) {
            return false;
        }

        return DB::table('vitals_triage')
            ->where('patient_id', $queue->patient_id)
            ->where('visit_id', $queue->visit_id)
            ->exists();
    }

    private function isCash(string $method): bool
    {
        $method = strtolower($method);

        return str_contains($method, 'cash') || str_contains($method, 'm-pesa') || str_contains($method, 'mpesa');
    }

    private function noteFor(string $station, bool $free, bool $cash): string
    {
        if ($station === 'Triage' && $cash && ! $free) {
            return 'Triage first. If consultation payment is due, proceed to Billing after the safety screen.';
        }
        if ($free) {
            return 'Free consultation. Proceed to Triage.';
        }
        if ($cash) {
            return 'Consultation paid. Proceed to Triage.';
        }

        return 'Insurance consultation. Proceed to '.$station.'.';
    }

    private function assertKnownFields(array $data): void
    {
        $unknown = array_values(array_diff(array_keys($data), self::KNOWN_FIELDS));
        if ($unknown !== []) {
            throw new RuntimeException('Unknown queue fields: '.implode(', ', $unknown), 422);
        }
    }
}
