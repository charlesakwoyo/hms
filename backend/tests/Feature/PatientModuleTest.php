<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesPatientModuleData;
use Tests\TestCase;

class PatientModuleTest extends TestCase
{
    use CreatesPatientModuleData;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPatientModuleData();
    }

    public function test_patient_search_is_server_side_and_paginated(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001', ['name' => 'Test Patient One', 'nationalId' => 'NAT-1001', 'phone' => '+254700000101']);
        $this->createPatient('P-1002', ['name' => 'Test Patient Two', 'nationalId' => 'NAT-1002', 'phone' => '+254700000102']);
        $this->createPatient('P-1003', ['name' => 'Test Patient Three', 'nationalId' => 'NAT-1003', 'phone' => '+254700000103']);

        $response = $this->actingAs($user)->getJson('/api/patients?search=Test+Patient&per_page=2&page=1');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonCount(2, 'data');
    }

    public function test_registration_generates_patient_number_and_audits_it(): void
    {
        $user = $this->patientModuleUser();
        $payload = $this->patientPayload(['name' => 'Jane Registered']);

        $response = $this->actingAs($user)->postJson('/api/patients', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('id', 'P-1001')
            ->assertJsonPath('data.patientNumber', 'P-1001')
            ->assertJsonPath('data.fullName', 'Jane Registered');

        $this->assertDatabaseHas('patients', ['id' => 'P-1001', 'full_name' => 'Jane Registered', 'phone_normalized' => '0700000001']);
        $this->assertDatabaseHas('patient_visits', ['patient_id' => 'P-1001', 'visit_number' => 'V-1001']);
        $this->assertSame(1, $this->auditCount('PATIENT_IDENTIFIER_ASSIGNED', 'P-1001'));
        $this->assertSame(1, $this->auditCount('PATIENT_CREATED', 'P-1001'));
        $this->assertSame(1, $this->auditCount('VISIT_OPENED'));
    }

    public function test_identical_national_id_is_blocked_as_duplicate(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'admin-duplicate-check');
        $this->createPatient('P-1001', ['nationalId' => 'NAT-DUPLICATE']);

        $response = $this->actingAs($user)->postJson('/api/patients', $this->patientPayload([
            'name' => 'Other Name',
            'nationalId' => 'NAT-DUPLICATE',
            'phone' => '+254700000999',
        ]));

        $response->assertStatus(409)
            ->assertJsonPath('code', 'duplicate_patient')
            ->assertJsonPath('data.matches.0.id', 'P-1001');
        $this->assertDatabaseMissing('patients', ['phone' => '+254700000999']);
    }

    public function test_duplicate_override_requires_admin_token_and_is_audited(): void
    {
        $admin = $this->patientModuleUser('System Administrator', 'admin-duplicate');
        $this->createPatient('P-9001', [
            'name' => 'Joy Achieng',
            'dob' => '2004-01-22',
            'phone' => '0713874111',
            'nationalId' => null,
        ]);
        $payload = $this->patientPayload([
            'name' => 'Joy Achieng',
            'dob' => '2004-01-22',
            'phone' => '+254713874111',
            'nationalId' => null,
        ]);

        $first = $this->actingAs($admin)->postJson('/api/patients', $payload);
        $first->assertStatus(409)->assertJsonPath('code', 'duplicate_patient');
        $token = $first->json('data.overrideToken');
        $this->assertNotEmpty($token);

        $second = $this->actingAs($admin)->postJson('/api/patients', array_merge($payload, [
            'duplicateOverrideToken' => $token,
            'duplicateOverrideReason' => 'Different birth certificate presented.',
        ]));

        $second->assertOk()->assertJsonPath('id', 'P-1001');
        $this->assertSame(1, $this->auditCount('DUPLICATE_OVERRIDE', 'P-1001'));
    }

    public function test_receptionist_cannot_override_duplicate(): void
    {
        $user = $this->patientModuleUser('Receptionist', 'receptionist-duplicate');
        $this->createPatient('P-9001', ['nationalId' => 'NAT-DUPLICATE']);

        $response = $this->actingAs($user)->postJson('/api/patients', $this->patientPayload(['nationalId' => 'NAT-DUPLICATE']));

        $response->assertStatus(403);
        $this->assertDatabaseMissing('patients', ['id' => 'P-1001']);
    }

    public function test_client_supplied_patient_number_is_rejected(): void
    {
        $user = $this->patientModuleUser();

        $response = $this->actingAs($user)->postJson('/api/patients', array_merge($this->patientPayload(), ['id' => 'P-CLIENT']));

        $response->assertStatus(422);
        $this->assertDatabaseMissing('patients', ['id' => 'P-CLIENT']);
    }

    public function test_patient_detail_includes_active_visit_and_queue(): void
    {
        $user = $this->patientModuleUser('Medical Doctor', 'doctor-detail');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        DB::table('patient_queue')->insert([
            'id' => 'Q-1001',
            'ticket_number' => 'T-1001',
            'patient_id' => 'P-1001',
            'patient_name' => 'Test Patient',
            'arrived_time' => now(),
            'current_station' => 'Triage',
            'priority' => 'Normal',
            'status' => 'Waiting',
            'consultation_fee' => 0,
            'branch_id' => 1,
            'visit_id' => $visitId,
        ]);

        $response = $this->actingAs($user)->getJson('/api/patients/P-1001');

        $response->assertOk()
            ->assertJsonPath('data.id', 'P-1001')
            ->assertJsonPath('data.activeVisits.0.id', $visitId)
            ->assertJsonPath('data.queueStatus.ticketNumber', 'T-1001');
    }

    public function test_update_rejects_unknown_fields_and_audits_changes(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');

        $invalid = $this->actingAs($user)->putJson('/api/patients/P-1001', array_merge($this->patientPayload(), ['createdBy' => 'x']));
        $invalid->assertStatus(422)->assertJsonPath('success', false);

        $valid = $this->actingAs($user)->putJson('/api/patients/P-1001', $this->patientPayload(['name' => 'Updated Patient']));
        $valid->assertOk()->assertJsonPath('data.fullName', 'Updated Patient');
        $this->assertDatabaseHas('patients', ['id' => 'P-1001', 'full_name' => 'Updated Patient', 'full_name_normalized' => 'updated patient']);
        $this->assertSame(1, $this->auditCount('PATIENT_UPDATED', 'P-1001'));
    }

    public function test_deactivate_and_reactivate_are_audited(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');

        $this->actingAs($user)->postJson('/api/patients/P-1001/deactivate')
            ->assertOk()->assertJsonPath('data.status', 'Inactive');
        $this->actingAs($user)->postJson('/api/patients/P-1001/reactivate')
            ->assertOk()->assertJsonPath('data.status', 'Active');

        $this->assertSame(1, $this->auditCount('PATIENT_DEACTIVATED', 'P-1001'));
        $this->assertSame(1, $this->auditCount('PATIENT_REACTIVATED', 'P-1001'));
    }

    public function test_visit_creation_reuses_recent_active_visit_unless_new_visit_requested(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');

        $first = $this->actingAs($user)->postJson('/api/patients/P-1001/visits', ['departmentId' => 4001]);
        $first->assertOk();
        $visitId = $first->json('data.id');

        $second = $this->actingAs($user)->postJson('/api/patients/P-1001/visits', ['departmentId' => 4001]);
        $second->assertOk()->assertJsonPath('data.id', $visitId);

        $third = $this->actingAs($user)->postJson('/api/patients/P-1001/visits', ['departmentId' => 4001, 'newVisit' => true]);
        $third->assertOk();
        $this->assertNotSame($visitId, $third->json('data.id'));
    }

    public function test_visit_cancel_updates_status_and_audits_it(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');

        $this->actingAs($user)->postJson('/api/visits/'.$visitId.'/cancel')
            ->assertOk()->assertJsonPath('data.status', 'Cancelled');

        $this->assertSame(1, $this->auditCount('VISIT_CANCELLED', $visitId));
    }

    public function test_cash_consultation_is_routed_to_triage_before_billing(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');

        $response = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
        ->assertJsonPath('destination', 'Triage')
        ->assertJsonPath('data.current_station', 'Triage');
        $this->assertSame(1, $this->auditCount('QUEUE_ENTRY_CREATED', $response->json('id')));
        $this->assertDatabaseHas('workflow_events', [
            'patient_id' => 'P-1001',
            'source_id' => $response->json('id'),
            'from_station' => 'Registration',
            'to_station' => 'Triage',
        ]);
    }

    public function test_cashier_payment_routes_consultation_to_consultation_not_configured_lab_station(): void
    {
        $cashier = $this->patientModuleUser('Billing Cashier', 'cashier-payment');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($cashier)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ])->assertOk()->json('id');
        $triageUser = $this->patientModuleUser('System Administrator', 'triage-before-billing');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Routine consultation',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($cashier)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Billing'])
            ->assertOk()->assertJsonPath('data.current_station', 'Billing');
        DB::table('setup_workflow_mappings')
            ->where('source_entity', 'setup-consultation-services')
            ->where('source_id', '5001')
            ->update(['execution_station' => 'Laboratory']);

        $response = $this->actingAs($cashier)->postJson('/api/queue/'.$queueId.'/consultation-payment', [
            'paymentMethod' => 'Cash',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.destination', 'Consultation')
            ->assertJsonPath('data.data.consultation_fee_paid', 1)
            ->assertJsonPath('data.data.current_station', 'Consultation');

        $invoiceId = $response->json('data.invoiceId');
        $this->assertDatabaseHas('invoices', [
            'id' => $invoiceId,
            'patient_id' => 'P-1001',
            'visit_id' => $visitId,
            'total_amount' => 100,
            'amount_paid' => 100,
            'balance' => 0,
            'status' => 'Paid',
            'cashier_name' => 'Billing Cashier Test User',
        ]);
        $this->assertDatabaseHas('invoice_items', [
            'invoice_id' => $invoiceId,
            'source_entity' => 'patient_queue',
            'source_id' => $queueId,
            'total' => 100,
            'is_paid' => 1,
        ]);
        $this->assertDatabaseHas('invoice_payment_splits', [
            'invoice_id' => $invoiceId,
            'payment_method' => 'Cash',
            'amount' => 100,
        ]);
        $this->assertSame(1, $this->auditCount('CONSULTATION_PAYMENT_RECORDED', $invoiceId));
        $this->assertDatabaseHas('workflow_events', [
            'source_id' => $queueId,
            'from_station' => 'Billing',
            'to_station' => 'Consultation',
            'event_type' => 'CONSULTATION_PAYMENT_CONFIRMED',
        ]);
    }

    public function test_unpaid_cash_queue_cannot_be_routed_from_billing_or_discharged(): void
    {
        $user = $this->patientModuleUser('Receptionist', 'cash-route-block');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ])->assertOk()->json('id');

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Billing'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Record the triage assessment before routing this patient onward.');
        $triageUser = $this->patientModuleUser('System Administrator', 'triage-before-cash-guard');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Routine consultation',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'Complete triage, then route this unpaid cash patient to Billing before Consultation.');
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Billing'])
            ->assertOk()->assertJsonPath('data.current_station', 'Billing');
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])
            ->assertStatus(422);
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Discharged'])
            ->assertStatus(422);
        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'current_station' => 'Billing',
            'consultation_fee_paid' => 0,
        ]);
    }

    public function test_triage_assessment_is_saved_and_required_before_leaving_triage(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'triage-assessment');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
        ])->assertOk()->json('id');

        $this->actingAs($user)->getJson('/api/triage/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.queueId', $queueId)
            ->assertJsonPath('data.0.status', 'Waiting');

        $this->actingAs($user)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Headache since yesterday',
            'systolic' => 120,
            'diastolic' => 80,
            'pulse' => 72,
            'temperature' => 36.8,
            'respiratoryRate' => 16,
            'spo2' => 98,
            'triageCategory' => 'Urgent',
            'nurseNotes' => 'Patient is alert.',
        ])->assertOk()
            ->assertJsonPath('data.presentingComplaint', 'Headache since yesterday')
            ->assertJsonPath('data.triageCategory', 'Urgent');

        $this->actingAs($user)->getJson('/api/triage/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'Triaged')
            ->assertJsonPath('data.0.assessment.systolic', '120.00');
        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'priority' => 'Urgent',
        ]);

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])
            ->assertOk()->assertJsonPath('data.current_station', 'Consultation');
    }

    public function test_consultation_encounter_displays_triage_and_saves_catalog_diagnosis(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'consultation-encounter');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
        ])->assertOk()->json('id');
        $this->actingAs($user)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Headache',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])
            ->assertOk();

        $this->actingAs($user)->getJson('/api/consultation/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.queueId', $queueId);
        $this->actingAs($user)->getJson('/api/consultation/'.$queueId.'/encounter')
            ->assertOk()
            ->assertJsonPath('data.patient.id', 'P-1001')
            ->assertJsonPath('data.triage.presentingComplaint', 'Headache')
            ->assertJsonPath('data.diagnoses', []);

        $this->actingAs($user)->putJson('/api/consultation/'.$queueId.'/notes', [
            'subjective' => 'Headache since yesterday',
            'objective' => 'No focal deficit',
            'assessment' => 'Working diagnosis under review',
            'plan' => 'Review after investigations',
        ])->assertOk()
            ->assertJsonPath('data.status', 'Draft');

        $this->actingAs($user)->getJson('/api/consultation/'.$queueId.'/encounter')
            ->assertOk()
            ->assertJsonPath('data.consultation.historyOfPresentIllness', 'Headache since yesterday')
            ->assertJsonPath('data.consultation.examinationFindings', 'No focal deficit')
            ->assertJsonPath('data.consultation.provisionalDiagnosis', 'Working diagnosis under review')
            ->assertJsonPath('data.consultation.managementPlan', 'Review after investigations');

        $catalogId = DB::table('setup_icd11')->insertGetId([
            'code' => 'TEST-HEADACHE',
            'title' => 'Headache, test catalogue item',
            'chapter' => 'Symptoms',
        ]);
        $response = $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/diagnoses', [
            'catalogId' => $catalogId,
            'type' => 'Primary',
        ])->assertOk()
            ->assertJsonPath('data.diagnosis.code', 'TEST-HEADACHE')
            ->assertJsonPath('data.diagnosis.type', 'Primary');

        $this->actingAs($user)->getJson('/api/consultation/'.$queueId.'/encounter')
            ->assertOk()
            ->assertJsonPath('data.diagnoses.0.title', 'Headache, test catalogue item');
        $this->assertDatabaseHas('consultation_diagnoses', [
            'id' => $response->json('data.diagnosis.id'),
            'patient_id' => 'P-1001',
            'visit_id' => $visitId,
            'diagnosis_code' => 'TEST-HEADACHE',
            'diagnosis_type' => 'Primary',
        ]);
    }

    public function test_consultation_can_request_admission_without_closing_visit_or_leaving_consultation(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'consultation-admission-request');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
        ])->assertOk()->json('id');
        $this->actingAs($user)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Breathing difficulty',
            'triageCategory' => 'Urgent',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])->assertOk();

        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/disposition', [
            'outcome' => 'Admission',
            'reason' => 'Requires inpatient observation',
            'urgency' => 'Urgent',
        ])->assertOk()
            ->assertJsonPath('data.outcome', 'Admission')
            ->assertJsonPath('data.status', 'Admission Requested');

        $this->assertDatabaseHas('patient_visits', ['id' => $visitId, 'status' => 'Open', 'closed_at' => null]);
        $this->assertDatabaseHas('patient_queue', ['id' => $queueId, 'current_station' => 'Consultation']);
        $this->actingAs($user)->getJson('/api/consultation/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.dispositionOutcome', 'Admission')
            ->assertJsonPath('data.0.dispositionStatus', 'Admission Requested');
        $this->actingAs($user)->getJson('/api/consultation/'.$queueId.'/encounter')
            ->assertOk()
            ->assertJsonPath('data.disposition.reason', 'Requires inpatient observation')
            ->assertJsonPath('data.disposition.urgency', 'Urgent');

        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/disposition', [
            'outcome' => 'Discharge',
            'instructions' => 'Follow up next week',
        ])->assertStatus(422);
    }

    public function test_consultation_discharge_requires_saved_plan_and_completed_lab_orders_then_closes_visit(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'consultation-discharge');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
        ])->assertOk()->json('id');
        $this->actingAs($user)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Headache',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])->assertOk();

        $payload = ['outcome' => 'Discharge', 'instructions' => 'Return if symptoms worsen and follow up in one week.'];
        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/disposition', $payload)
            ->assertStatus(422)
            ->assertJsonPath('error', 'Save the clinician assessment and plan before discharging this patient.');

        $this->actingAs($user)->putJson('/api/consultation/'.$queueId.'/notes', [
            'subjective' => 'Headache since yesterday',
            'objective' => 'No focal deficit',
            'assessment' => 'Stable headache',
            'plan' => 'Rest and follow up if symptoms continue.',
        ])->assertOk();
        DB::table('lab_orders')->insert([
            'id' => 'LAB-DISCHARGE-1',
            'patient_id' => 'P-1001',
            'patient_name' => 'Test Patient',
            'visit_id' => $visitId,
            'test_name' => 'Full Blood Count',
            'status' => 'Pending',
        ]);
        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/disposition', $payload)
            ->assertStatus(422)
            ->assertJsonPath('error', 'Resolve or cancel all outstanding laboratory orders before discharge.');

        DB::table('lab_orders')->where('id', 'LAB-DISCHARGE-1')->update(['status' => 'Verified']);
        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/disposition', $payload)
            ->assertOk()
            ->assertJsonPath('data.outcome', 'Discharge')
            ->assertJsonPath('data.status', 'Completed');

        $this->assertDatabaseHas('patient_visits', ['id' => $visitId, 'status' => 'Closed']);
        $this->assertDatabaseHas('patient_queue', ['id' => $queueId, 'current_station' => 'Discharged', 'status' => 'Completed']);
        $this->assertDatabaseHas('consultation_dispositions', [
            'visit_id' => $visitId,
            'outcome' => 'Discharge',
            'instructions' => $payload['instructions'],
            'status' => 'Completed',
        ]);
        $this->actingAs($user)->getJson('/api/consultation/worklist')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_consultation_orders_lab_tests_and_routes_patient_to_laboratory(): void
    {
        $user = $this->patientModuleUser('Medical Doctor', 'lab-order-required');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
        ])->assertOk()->json('id');

        $triageUser = $this->patientModuleUser('System Administrator', 'triage-before-lab-test');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Routine consultation',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Laboratory'])
            ->assertStatus(422)
            ->assertJsonPath('error', 'This service cannot be added to the queue until a clinician places the corresponding order.');

        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'current_station' => 'Triage',
        ]);

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])->assertOk();
        $labTestId = DB::table('setup_lab_tests')->insertGetId([
            'code' => 'TEST-FBC',
            'name' => 'Full Blood Count',
            'department' => 'Haematology',
            'specimen_type' => 'Blood',
            'status' => 'Active',
        ]);
        $orderResponse = $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/laboratory-orders', [
            'testIds' => [$labTestId],
            'clinicalIndication' => 'Evaluate persistent fever',
        ])->assertOk()
            ->assertJsonPath('data.destination', 'Laboratory')
            ->assertJsonPath('data.orders.0.code', 'TEST-FBC')
            ->assertJsonPath('data.orders.0.status', 'Pending')
            ->assertJsonPath('data.queue.current_station', 'Laboratory');
        $orderId = (string) $orderResponse->json('data.orders.0.id');

        $this->assertDatabaseHas('lab_orders', [
            'patient_id' => 'P-1001',
            'visit_id' => $visitId,
            'setup_lab_test_id' => $labTestId,
            'clinical_indication' => 'Evaluate persistent fever',
            'status' => 'Pending',
        ]);
        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'current_station' => 'Laboratory',
        ]);

        $labUser = $this->patientModuleUser('Laboratory Technician', 'lab-worklist');
        $this->actingAs($labUser)->getJson('/api/laboratory/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.patientId', 'P-1001')
            ->assertJsonPath('data.0.testName', 'Full Blood Count')
            ->assertJsonPath('data.0.clinicalIndication', 'Evaluate persistent fever')
            ->assertJsonPath('data.0.status', 'Pending');

        $this->actingAs($labUser)->postJson('/api/laboratory/orders/'.$orderId.'/collect', [])
            ->assertOk()
            ->assertJsonPath('data.status', 'Collected');
        $accessionNo = (string) DB::table('lab_orders')->where('id', $orderId)->value('specimen_accession_no');
        $this->assertStringStartsWith('SPC-', $accessionNo);
        $this->assertDatabaseHas('lab_orders', ['id' => $orderId, 'collected_by' => $labUser->full_name]);

        $this->actingAs($labUser)->postJson('/api/laboratory/orders/'.$orderId.'/reject-specimen', [
            'reason' => 'Specimen haemolysed',
        ])->assertOk()->assertJsonPath('data.status', 'Awaiting Recollection');
        $this->assertDatabaseHas('lab_orders', [
            'id' => $orderId,
            'rejection_reason' => 'Specimen haemolysed',
            'rejected_by' => $labUser->full_name,
        ]);

        $this->actingAs($labUser)->postJson('/api/laboratory/orders/'.$orderId.'/collect', [])
            ->assertOk()->assertJsonPath('data.status', 'Collected');
        $this->assertDatabaseHas('lab_orders', ['id' => $orderId, 'recollection_count' => 1]);

        $this->actingAs($labUser)->putJson('/api/laboratory/orders/'.$orderId.'/result', [
            'resultValue' => 'Within expected range',
            'referenceRange' => '4.0-10.0',
            'notes' => 'Sample processed.',
        ])->assertOk()->assertJsonPath('data.status', 'Result Entered');
        $this->assertDatabaseHas('lab_orders', [
            'id' => $orderId,
            'result_value' => 'Within expected range',
            'status' => 'Result Entered',
            'result_entered_by' => $labUser->full_name,
        ]);
        DB::table('patient_queue')->where('id', $queueId)->update([
            'arrived_time' => now()->subDays(2),
        ]);

        $this->actingAs($labUser)->postJson('/api/laboratory/orders/'.$orderId.'/verify', [])
            ->assertOk()
            ->assertJsonPath('data.status', 'Verified')
            ->assertJsonPath('data.returnedToConsultation', true);
        $this->assertDatabaseHas('lab_orders', [
            'id' => $orderId,
            'status' => 'Verified',
            'verified_by' => $labUser->full_name,
        ]);
        $this->assertDatabaseHas('patient_queue', ['id' => $queueId, 'current_station' => 'Consultation']);
        $this->actingAs($user)->getJson('/api/consultation/worklist')
            ->assertOk()
            ->assertJsonPath('data.0.patientId', 'P-1001');
        $this->actingAs($user)->getJson('/api/consultation/'.$queueId.'/encounter')
            ->assertOk()
            ->assertJsonPath('data.labOrders.0.status', 'Verified')
            ->assertJsonPath('data.labOrders.0.resultValue', 'Within expected range')
            ->assertJsonPath('data.labOrders.0.verifiedBy', $labUser->full_name);
        $this->assertSame(2, $this->auditCount('LAB_SPECIMEN_COLLECTED', $orderId));
        $this->assertSame(1, $this->auditCount('LAB_SPECIMEN_REJECTED', $orderId));
        $this->assertSame(1, $this->auditCount('LAB_RESULT_ENTERED', $orderId));
        $this->assertSame(1, $this->auditCount('LAB_RESULT_VERIFIED', $orderId));
    }

    public function test_emergency_lab_order_does_not_move_patient_out_of_consultation(): void
    {
        $user = $this->patientModuleUser('Medical Doctor', 'emergency-lab-order');
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'paymentMethod' => 'SHA / NHIF',
            'priority' => 'Emergency',
        ])->assertOk()->json('id');
        $triageUser = $this->patientModuleUser('System Administrator', 'emergency-triage-assessment');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Emergency assessment',
            'triageCategory' => 'Emergency',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])->assertOk();

        $labTestId = DB::table('setup_lab_tests')->insertGetId([
            'code' => 'TEST-EMERGENCY',
            'name' => 'Emergency test',
            'status' => 'Active',
        ]);
        $this->actingAs($user)->postJson('/api/consultation/'.$queueId.'/laboratory-orders', [
            'testIds' => [$labTestId],
            'clinicalIndication' => 'Urgent clinician assessment',
        ])->assertOk()
            ->assertJsonPath('data.deferredForEmergency', true)
            ->assertJsonPath('data.destination', 'Consultation')
            ->assertJsonPath('data.queue.current_station', 'Consultation');

        $this->assertDatabaseHas('patient_queue', ['id' => $queueId, 'current_station' => 'Consultation']);
    }

    public function test_non_cashier_cannot_record_consultation_payment(): void
    {
        $user = $this->patientModuleUser('Receptionist', 'no-cashier-payment');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ])->assertOk()->json('id');

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/consultation-payment', [
            'paymentMethod' => 'Cash',
        ])->assertForbidden();

        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_paid_cash_queue_stuck_at_billing_can_continue_to_configured_station(): void
    {
        $user = $this->patientModuleUser('Receptionist', 'continue-paid-queue');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ])->assertOk()->json('id');
        $triageUser = $this->patientModuleUser('System Administrator', 'triage-before-recovery-test');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Routine consultation',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Billing'])
            ->assertOk();
        $invoiceId = 'INV-QUEUE-RECOVERY';
        DB::table('invoices')->insert([
            'id' => $invoiceId,
            'patient_id' => 'P-1001',
            'invoice_date' => now()->toDateString(),
            'total_amount' => 100,
            'amount_paid' => 100,
            'balance' => 0,
            'status' => 'Paid',
            'branch_id' => 1,
            'visit_id' => $visitId,
            'invoice_type' => 'OPD',
        ]);
        DB::table('invoice_items')->insert([
            'invoice_id' => $invoiceId,
            'description' => 'Consultation',
            'total' => 100,
            'source_entity' => 'patient_queue',
            'source_id' => $queueId,
            'branch_id' => 1,
            'is_paid' => 1,
        ]);
        DB::table('patient_queue')->where('id', $queueId)->update(['consultation_fee_paid' => 1]);

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/continue-after-payment')
            ->assertOk()
            ->assertJsonPath('data.destination', 'Consultation')
            ->assertJsonPath('data.data.current_station', 'Consultation');

        $this->assertSame(1, $this->auditCount('QUEUE_CONTINUED_AFTER_PAYMENT', $queueId));
        $this->assertDatabaseHas('workflow_events', [
            'source_id' => $queueId,
            'from_station' => 'Billing',
            'to_station' => 'Consultation',
            'event_type' => 'QUEUE_CONTINUED_AFTER_PAYMENT',
        ]);
    }

    public function test_paid_flag_without_paid_invoice_cannot_release_cash_queue(): void
    {
        $user = $this->patientModuleUser('Receptionist', 'continue-unverified-queue');
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
        ])->assertOk()->json('id');
        $triageUser = $this->patientModuleUser('System Administrator', 'triage-before-paid-flag-test');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Routine consultation',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Billing'])
            ->assertOk();
        DB::table('patient_queue')->where('id', $queueId)->update(['consultation_fee_paid' => 1]);

        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/continue-after-payment')
            ->assertStatus(422)
            ->assertJsonPath('error', 'A paid invoice for this queue entry was not found. Ask the cashier to verify payment.');
        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'current_station' => 'Billing',
        ]);
    }

    public function test_emergency_free_consultation_is_routed_to_triage(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA']);
        $visitId = $this->createVisit('P-1001');

        $response = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
            'priority' => 'Emergency',
        ]);

        $response->assertOk()
            ->assertJsonPath('destination', 'Triage')
            ->assertJsonPath('data.current_station', 'Triage');
        $this->assertSame(1, $this->auditCount('QUEUE_ENTRY_CREATED', $response->json('id')));
    }

    public function test_emergency_cash_patient_can_proceed_from_triage_without_payment(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001');
        $visitId = $this->createVisit('P-1001');
        $queueId = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 100,
            'paymentMethod' => 'Cash / M-Pesa',
            'priority' => 'Emergency',
        ])->assertOk()
            ->assertJsonPath('destination', 'Triage')
            ->json('id');

        $triageUser = $this->patientModuleUser('System Administrator', 'triage-emergency-test');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queueId.'/assessment', [
            'presentingComplaint' => 'Urgent assessment',
            'triageCategory' => 'Emergency',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queueId.'/route', ['station' => 'Consultation'])
            ->assertOk()->assertJsonPath('data.current_station', 'Consultation');
        $this->assertDatabaseHas('patient_queue', [
            'id' => $queueId,
            'consultation_fee_paid' => 0,
            'priority' => 'Emergency',
        ]);
    }

    public function test_queue_route_requires_right_and_records_station_change(): void
    {
        $user = $this->patientModuleUser();
        $this->createPatient('P-1001', ['insuranceProvider' => 'SHA / NHIF']);
        $visitId = $this->createVisit('P-1001');
        $queue = $this->actingAs($user)->postJson('/api/queue', [
            'patientId' => 'P-1001',
            'visitId' => $visitId,
            'consultationServiceId' => 5001,
            'consultationFee' => 0,
        ])->assertOk()->json('id');

        $triageUser = $this->patientModuleUser('System Administrator', 'triage-route-test');
        $this->actingAs($triageUser)->postJson('/api/triage/'.$queue.'/assessment', [
            'presentingComplaint' => 'Routine assessment',
            'triageCategory' => 'Normal',
        ])->assertOk();
        $this->actingAs($user)->postJson('/api/queue/'.$queue.'/route', ['station' => 'Consultation'])
            ->assertOk()->assertJsonPath('data.current_station', 'Consultation');

        $this->assertSame(1, $this->auditCount('QUEUE_ROUTE_CHANGED', $queue));
        $this->assertDatabaseHas('workflow_events', [
            'source_id' => $queue,
            'to_station' => 'Consultation',
            'event_type' => 'QUEUE_ROUTE_CHANGED',
        ]);
    }

    public function test_unknown_role_is_denied_patient_access(): void
    {
        $user = $this->patientModuleUser('Unknown Role', 'unknown-role');

        $this->actingAs($user)->getJson('/api/patients')
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }
}
