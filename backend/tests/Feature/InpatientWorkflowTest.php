<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreatesPatientModuleData;
use Tests\TestCase;

class InpatientWorkflowTest extends TestCase
{
    use CreatesPatientModuleData;
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedPatientModuleData();
    }

    public function test_admission_request_is_accepted_with_an_available_bed_and_routes_patient_inpatient(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'ipd-accept');
        $request = $this->createAdmissionRequest();

        $this->actingAs($user)->getJson('/api/inpatient/admission-requests')
            ->assertOk()
            ->assertJsonPath('data.0.patientName', 'Test Patient');
        $this->actingAs($user)->getJson('/api/inpatient/available-beds')
            ->assertOk()
            ->assertJsonPath('data.0.wardName', 'Medical Ward');

        $response = $this->actingAs($user)->postJson("/api/inpatient/admission-requests/{$request}/accept", ['bedId' => 9001]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'Admitted')
            ->assertJsonPath('data.bedNumber', 'B-01');
        $this->assertDatabaseHas('admissions', [
            'patient_id' => 'P-IPD-1',
            'visit_id' => 'VISIT-IPD-1',
            'setup_bed_id' => 9001,
            'status' => 'Admitted',
        ]);
        $this->assertDatabaseHas('patient_queue', ['id' => 'Q-IPD-1', 'current_station' => 'Inpatient Ward']);
        $this->assertDatabaseHas('patient_visits', ['id' => 'VISIT-IPD-1', 'encounter_type' => 'Inpatient', 'status' => 'In Progress']);
        $this->assertDatabaseHas('patients', ['id' => 'P-IPD-1', 'status' => 'Admitted', 'current_bed' => 'B-01']);
        $this->assertDatabaseHas('setup_bed_items', ['id' => 9001, 'status' => 'Occupied']);
    }

    public function test_admitted_patient_can_be_discharged_and_the_bed_is_released(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'ipd-discharge');
        $request = $this->createAdmissionRequest();
        $accepted = $this->actingAs($user)->postJson("/api/inpatient/admission-requests/{$request}/accept", ['bedId' => 9001]);
        $admissionId = (string) $accepted->json('data.id');

        $this->actingAs($user)->postJson("/api/inpatient/admissions/{$admissionId}/discharge", [
            'summary' => 'Stable at discharge; follow up in one week.',
        ])->assertOk()->assertJsonPath('data.status', 'Discharged');

        $this->assertDatabaseHas('admissions', ['id' => $admissionId, 'status' => 'Discharged']);
        $this->assertDatabaseHas('patient_queue', ['id' => 'Q-IPD-1', 'current_station' => 'Discharged', 'status' => 'Completed']);
        $this->assertDatabaseHas('patient_visits', ['id' => 'VISIT-IPD-1', 'status' => 'Closed']);
        $this->assertDatabaseHas('patients', ['id' => 'P-IPD-1', 'status' => 'Active', 'current_bed' => null]);
        $this->assertDatabaseHas('setup_bed_items', ['id' => 9001, 'status' => 'Available']);
    }

    public function test_declining_an_admission_request_records_reason_and_leaves_patient_in_consultation(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'ipd-decline');
        $request = $this->createAdmissionRequest();

        $this->actingAs($user)->postJson("/api/inpatient/admission-requests/{$request}/decline", [
            'reason' => 'No inpatient indication after review.',
        ])->assertOk()->assertJsonPath('data.status', 'Declined');

        $this->assertDatabaseHas('consultation_dispositions', [
            'id' => $request,
            'status' => 'Declined',
            'instructions' => 'No inpatient indication after review.',
        ]);
        $this->assertDatabaseHas('patient_queue', ['id' => 'Q-IPD-1', 'current_station' => 'Consultation']);
        $this->assertDatabaseMissing('admissions', ['patient_id' => 'P-IPD-1']);
    }

    public function test_admission_clinical_note_can_be_saved_signed_and_loaded_in_the_chart(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'ipd-chart-admission-note');
        $request = $this->createAdmissionRequest();
        $accepted = $this->actingAs($user)->postJson("/api/inpatient/admission-requests/{$request}/accept", ['bedId' => 9001]);
        $admissionId = (string) $accepted->json('data.id');

        $this->actingAs($user)->putJson("/api/inpatient/admissions/{$admissionId}/admission-notes", [
            'chiefComplaint' => 'Persistent fever',
            'historyPresentIllness' => 'Fever for three days before admission.',
            'pastHistory' => 'No significant history.',
            'examination' => 'Alert; febrile.',
            'preMedications' => 'Paracetamol.',
            'tobaccoUse' => 'No',
            'alcoholUse' => 'Unknown',
            'substanceNotes' => '',
            'primaryDiagnosis' => 'Acute infection',
            'differentialDiagnoses' => 'Malaria',
            'orders' => 'Full blood count',
            'managementPlan' => 'Observe and treat according to results.',
            'designation' => 'Medical Officer',
        ])->assertOk()->assertJsonPath('data.status', 'Draft');

        $this->actingAs($user)->postJson("/api/inpatient/admissions/{$admissionId}/admission-notes/sign")
            ->assertOk()->assertJsonPath('data.status', 'Signed');

        $this->actingAs($user)->getJson("/api/inpatient/admissions/{$admissionId}/clinical-chart")
            ->assertOk()
            ->assertJsonPath('data.admission.patientName', 'Test Patient')
            ->assertJsonPath('data.admission.wardName', 'Medical Ward')
            ->assertJsonPath('data.admissionNotes.status', 'Signed')
            ->assertJsonPath('data.admissionNotes.examination', 'Alert; febrile.');

        $this->assertDatabaseHas('admission_clinical_notes', [
            'admission_id' => $admissionId,
            'status' => 'Signed',
            'primary_diagnosis' => 'Acute infection',
        ]);
    }

    public function test_inpatient_progress_notes_rounds_and_vitals_are_saved_to_the_active_chart(): void
    {
        $user = $this->patientModuleUser('System Administrator', 'ipd-chart-progress');
        $request = $this->createAdmissionRequest();
        $accepted = $this->actingAs($user)->postJson("/api/inpatient/admission-requests/{$request}/accept", ['bedId' => 9001]);
        $admissionId = (string) $accepted->json('data.id');

        $this->actingAs($user)->postJson("/api/inpatient/admissions/{$admissionId}/doctor-notes", [
            'diagnosis' => 'Acute infection',
            'subjective' => 'Fever is improving.',
            'objective' => 'Temperature 37.2 C.',
            'assessment' => 'Responding to treatment.',
            'plan' => 'Continue current treatment.',
        ])->assertOk();
        $this->actingAs($user)->postJson("/api/inpatient/admissions/{$admissionId}/ward-rounds", [
            'subjective' => 'No new concerns.',
            'objective' => 'Patient alert and comfortable.',
            'assessment' => 'Improving',
            'plan' => 'Continue observations.',
        ])->assertOk();
        $this->actingAs($user)->postJson("/api/inpatient/admissions/{$admissionId}/vitals", [
            'systolic' => 120,
            'diastolic' => 80,
            'pulse' => 76,
            'temperature' => 37.2,
            'respiratoryRate' => 18,
            'spo2' => 98,
        ])->assertOk();

        $this->actingAs($user)->getJson("/api/inpatient/admissions/{$admissionId}/clinical-chart")
            ->assertOk()
            ->assertJsonCount(1, 'data.doctorNotes')
            ->assertJsonCount(1, 'data.wardRounds')
            ->assertJsonCount(1, 'data.vitals');
    }

    private function createAdmissionRequest(): string
    {
        $this->createPatient('P-IPD-1');
        DB::table('wards')->insert([
            'id' => 'WARD-IPD-1',
            'name' => 'Medical Ward',
            'category' => 'Medical',
            'total_beds' => 1,
            'occupied_beds' => 0,
            'daily_rate' => 1000,
            'branch_id' => 1,
        ]);
        DB::table('setup_bed_items')->insert([
            'id' => 9001,
            'bed_number' => 'B-01',
            'ward_name' => 'Medical Ward',
            'ward_id' => null,
            'bed_type' => 'Standard',
            'status' => 'Available',
            'cash_daily_rate' => 1000,
        ]);
        $visitId = $this->createVisit('P-IPD-1', ['id' => 'VISIT-IPD-1']);
        DB::table('patient_queue')->insert([
            'id' => 'Q-IPD-1',
            'ticket_number' => 'T-IPD-1',
            'patient_id' => 'P-IPD-1',
            'patient_name' => 'Test Patient',
            'arrived_time' => now(),
            'current_station' => 'Consultation',
            'priority' => 'Urgent',
            'payment_method' => 'SHA',
            'consultation_fee_paid' => 1,
            'status' => 'Waiting',
            'consultation_fee' => 0,
            'branch_id' => 1,
            'visit_id' => $visitId,
        ]);
        DB::table('consultation_dispositions')->insert([
            'id' => 'DISP-IPD-1',
            'queue_id' => 'Q-IPD-1',
            'patient_id' => 'P-IPD-1',
            'visit_id' => $visitId,
            'outcome' => 'Admission',
            'reason' => 'Requires inpatient observation.',
            'urgency' => 'Urgent',
            'status' => 'Admission Requested',
            'decided_by' => 'Dr Test',
            'decided_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return 'DISP-IPD-1';
    }
}
