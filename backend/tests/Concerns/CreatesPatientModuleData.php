<?php

namespace Tests\Concerns;

use App\Models\User;
use App\Services\PatientNormalizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

trait CreatesPatientModuleData
{
    protected function seedPatientModuleData(): void
    {
        DB::table('hospital_branches')->insertOrIgnore([
            'id' => 1,
            'name' => 'Main Branch',
            'code' => 'MAIN',
            'status' => 'Active',
        ]);
        DB::table('setup_patient_categories')->insertOrIgnore([
            'id' => 1001,
            'code' => 'CASH',
            'name' => 'Cash',
            'is_cash' => 1,
            'status' => 'Active',
        ]);
        DB::table('setup_patient_subcategories')->insertOrIgnore([
            'id' => 2001,
            'category_id' => 1001,
            'category_code' => 'CASH',
            'category_name' => 'Cash',
            'sub_category_code' => 'CASH',
            'name' => 'Cash',
            'is_cash' => 1,
            'status' => 'Active',
        ]);
        DB::table('setup_patient_schemes')->insertOrIgnore([
            'id' => 3001,
            'sub_category_id' => 2001,
            'scheme_code' => 'CASH',
            'scheme_name' => 'Cash',
            'scheme_type' => 'Cash',
            'status' => 'Active',
        ]);
        DB::table('setup_departments')->insertOrIgnore([
            'id' => 4001,
            'code' => 'OPD',
            'name' => 'Outpatient',
            'status' => 'Active',
        ]);
        DB::table('setup_consultation_services')->insertOrIgnore([
            'id' => 5001,
            'code' => 'CONSULT',
            'name' => 'General Consultation',
            'department_id' => 4001,
            'cash_price' => 100.00,
            'status' => 'Active',
        ]);
        DB::table('setup_workflow_mappings')->insertOrIgnore([
            'id' => 'patient-test-consult',
            'source_entity' => 'setup-consultation-services',
            'source_id' => '5001',
            'source_code' => 'CONSULT',
            'workflow_code' => 'CONSULTATION',
            'execution_station' => 'Consultation',
            'billing_required' => 0,
            'active' => 1,
        ]);

        foreach (['PATIENT' => 1001, 'VISIT' => 1001, 'QUEUE' => 1001] as $key => $next) {
            DB::table('system_sequences')->insertOrIgnore([
                'sequence_key' => $key,
                'next_value' => $next,
            ]);
        }
    }

    protected function patientModuleUser(string $role = 'Receptionist', string $username = 'patient-test-user'): User
    {
        $id = 'USER-'.strtoupper(Str::random(8));
        DB::table('users')->insert([
            'id' => $id,
            'full_name' => $role.' Test User',
            'username' => $username.'-'.Str::lower(Str::random(6)),
            'password_hash' => bcrypt('secret'),
            'role' => $role,
            'status' => 'Active',
            'created_at' => now(),
        ]);

        return User::findOrFail($id);
    }

    protected function patientPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Patient',
            'dob' => '1990-05-20',
            'gender' => 'Male',
            'phone' => '+254700000001',
            'email' => 'test.patient@example.com',
            'nationalId' => 'NAT-0001',
            'patientCategoryId' => 1001,
            'patientSubCategoryId' => 2001,
            'schemeId' => 3001,
            'branchId' => 1,
        ], $overrides);
    }

    protected function createPatient(string $id, array $overrides = []): string
    {
        $payload = $this->patientPayload($overrides);
        $normalizer = app(PatientNormalizer::class);
        $dob = $normalizer->date($payload['dob'] ?? null);

        DB::table('patients')->insert([
            'id' => $id,
            'full_name' => $payload['name'],
            'age' => $normalizer->age($dob, $payload['age'] ?? null),
            'dob' => $dob,
            'gender' => $payload['gender'],
            'phone' => $payload['phone'],
            'phone_normalized' => $normalizer->phone($payload['phone']),
            'national_id' => $payload['nationalId'] ?? null,
            'national_id_normalized' => $normalizer->identifier($payload['nationalId'] ?? null),
            'birth_certificate_no' => $payload['birthCertificateNo'] ?? null,
            'full_name_normalized' => $normalizer->nameKey($payload['name']),
            'email' => $payload['email'] ?? null,
            'patient_category' => $payload['patientCategory'] ?? 'Cash',
            'patient_sub_category' => $payload['patientSubCategory'] ?? 'Cash',
            'patient_category_id' => $payload['patientCategoryId'] ?? 1001,
            'patient_sub_category_id' => $payload['patientSubCategoryId'] ?? 2001,
            'scheme_id' => $payload['schemeId'] ?? 3001,
            'insurance_provider' => $payload['insuranceProvider'] ?? 'Cash / M-Pesa',
            'status' => $payload['status'] ?? 'Registered',
            'registered_date' => now()->toDateString(),
            'branch_id' => $payload['branchId'] ?? 1,
        ]);

        return $id;
    }

    protected function createVisit(string $patientId, array $overrides = []): string
    {
        $id = 'VISIT-'.Str::upper(Str::random(8));
        DB::table('patient_visits')->insert(array_merge([
            'id' => $id,
            'visit_number' => 'V-TEST-'.Str::upper(Str::random(6)),
            'patient_id' => $patientId,
            'branch_id' => 1,
            'visit_date' => now()->toDateString(),
            'visit_time' => now()->format('H:i:s'),
            'visit_type' => 'Outpatient',
            'encounter_type' => 'Outpatient',
            'department_id' => 4001,
            'status' => 'Open',
            'source' => 'Registration',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return $id;
    }

    protected function auditCount(string $action, ?string $entityId = null): int
    {
        $query = DB::table('audit_log')->where('action', $action);
        if ($entityId !== null) {
            $query->where('entity_id', $entityId);
        }

        return (int) $query->count();
    }
}
