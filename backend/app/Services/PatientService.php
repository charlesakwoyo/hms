<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class PatientService
{
    public function __construct(private SequenceService $sequences, private BranchService $branches, private VisitService $visits) {}

    public function search(string $term = '', int $limit = 500): array
    {
        $query = DB::table('patients')->orderByDesc('created_at')->limit($limit);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(fn ($q) => $q->where('full_name', 'like', $like)->orWhere('id', 'like', $like)
                ->orWhere('phone', 'like', $like)->orWhere('national_id', 'like', $like));
        }

        return $query->get()->map(fn ($row) => $this->toClient((array) $row))->all();
    }

    public function find(string $id): ?array
    {
        $row = DB::table('patients')->where('id', $id)->first();

        return $row ? $this->toClient((array) $row) : null;
    }

    public function save(array $data, bool $isNew): array
    {
        $name = trim((string) ($data['name'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));
        if ($name === '') {
            throw new RuntimeException('Patient name is required', 422);
        }
        if ($phone === '') {
            throw new RuntimeException('Patient phone is required', 422);
        }

        return DB::transaction(function () use ($data, $isNew, $name, $phone) {
            $requested = trim((string) ($data['id'] ?? ''));
            $exists = $requested !== '' && DB::table('patients')->where('id', $requested)->exists();
            $id = $exists ? $requested : $this->sequences->next('PATIENT', 'P-');

            $dob = $this->date($data['dob'] ?? null);
            $age = $dob ? Carbon::parse($dob)->age : (int) ($data['age'] ?? 0);

            $kinName = trim((string) ($data['emergencyContact'] ?? ''));
            $kinPhone = trim((string) ($data['emergencyPhone'] ?? ''));
            $kinRelationship = trim((string) ($data['kinRelationship'] ?? ''));
            if (! $exists && $age < 18 && ($kinName === '' || $kinPhone === '' || $kinRelationship === '')) {
                throw new RuntimeException('This patient is a child. Enter the parent or guardian\'s name, phone number and relationship to the child under "Next of kin / guardian".', 422);
            }

            $category = $data['patientCategory'] ?? null;
            $subCategory = $data['patientSubCategory'] ?? null;
            $scheme = $data['insuranceScheme'] ?? null;
            $categoryId = $data['patientCategoryId'] ?? ($category ? DB::table('setup_patient_categories')->where('name', $category)->orWhere('code', $category)->value('id') : null);
            $subCategoryId = $data['patientSubCategoryId'] ?? ($subCategory ? DB::table('setup_patient_subcategories')->where('name', $subCategory)->orWhere('sub_category_code', $subCategory)->value('id') : null);
            $schemeId = $data['schemeId'] ?? ($scheme ? DB::table('setup_patient_schemes')->where('scheme_name', $scheme)->value('id') : null);
            $branchId = $this->branches->resolve($data['branchId'] ?? null);

            $row = [
                'full_name' => $name, 'age' => $age, 'dob' => $dob, 'gender' => $data['gender'] ?? 'Male', 'phone' => $phone,
                'email' => $data['email'] ?? null, 'national_id' => $data['nationalId'] ?? null, 'address' => $data['address'] ?? null,
                'emergency_contact' => $kinName ?: null, 'emergency_phone' => $kinPhone ?: null, 'kin_relationship' => $kinRelationship ?: null,
                'birth_certificate_no' => trim((string) ($data['birthCertificateNo'] ?? '')) ?: null,
                'blood_group' => $data['bloodGroup'] ?? null, 'allergies' => $data['allergies'] ?? null,
                'insurance_provider' => $data['insuranceProvider'] ?? null, 'insurance_scheme' => $scheme,
                'insurance_policy_no' => $data['insurancePolicyNo'] ?? null, 'insurance_number' => $data['insuranceNumber'] ?? null,
                'patient_category' => $category, 'patient_sub_category' => $subCategory, 'patient_category_id' => $categoryId,
                'patient_sub_category_id' => $subCategoryId, 'scheme_id' => $schemeId, 'status' => $data['status'] ?? 'Registered',
                'current_bed' => $data['currentBed'] ?? null, 'current_ward' => $data['currentWard'] ?? null,
                'sha_verified' => ! empty($data['shaVerified']) ? 1 : 0, 'sha_attendance_token' => $data['shaAttendanceToken'] ?? null,
                'registered_date' => $this->date($data['registeredDate'] ?? null) ?? now()->toDateString(), 'branch_id' => $branchId,
            ];
            DB::table('patients')->updateOrInsert(['id' => $id], $row);

            DB::table('entity_store')->updateOrInsert(
                ['entity_type' => 'patients', 'entity_id' => $id],
                ['patient_id' => $id, 'data_json' => json_encode(array_merge($data, ['id' => $id, 'patientCategoryId' => $categoryId, 'patientSubCategoryId' => $subCategoryId, 'schemeId' => $schemeId, 'branchId' => $branchId]), JSON_UNESCAPED_UNICODE)]
            );

            $visitId = null;
            if ($isNew || ! $exists) {
                $visitId = $this->visits->currentOrNew($id, array_merge($data, [
                    'source' => 'Registration', 'branchId' => $branchId, 'patientCategoryId' => $categoryId,
                    'patientSubCategoryId' => $subCategoryId, 'schemeId' => $schemeId,
                ]));
            }

            return ['id' => $id, 'visitId' => $visitId, 'patient' => $this->find($id)];
        });
    }

    private function date(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }
        try {
            return Carbon::parse($value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    private function toClient(array $p): array
    {
        $age = (int) ($p['age'] ?? 0);
        if (! empty($p['dob'])) {
            try {
                $age = Carbon::parse($p['dob'])->age;
            } catch (Throwable) {
            }
        }
        $visit = DB::table('patient_visits')->where('patient_id', $p['id'])->whereIn('status', ['Open', 'In Progress'])
            ->orderByDesc('visit_date')->orderByDesc('created_at')->first(['id', 'visit_number']);

        return [
            'id' => (string) $p['id'], 'name' => (string) $p['full_name'], 'age' => $age, 'dob' => $p['dob'], 'gender' => $p['gender'],
            'phone' => (string) $p['phone'], 'email' => $p['email'], 'nationalId' => $p['national_id'], 'address' => $p['address'],
            'emergencyContact' => $p['emergency_contact'], 'emergencyPhone' => $p['emergency_phone'], 'bloodGroup' => $p['blood_group'] ?: 'O+',
            'allergies' => $p['allergies'] ?: 'None', 'insuranceProvider' => $p['insurance_provider'] ?: 'Cash / M-Pesa',
            'insuranceScheme' => $p['insurance_scheme'] ?? '', 'insurancePolicyNo' => $p['insurance_policy_no'] ?? '',
            'insuranceNumber' => $p['insurance_number'] ?? '', 'patientCategory' => $p['patient_category'] ?? '',
            'patientSubCategory' => $p['patient_sub_category'] ?? '', 'patientCategoryId' => $p['patient_category_id'] ?? null,
            'patientSubCategoryId' => $p['patient_sub_category_id'] ?? null, 'schemeId' => $p['scheme_id'] ?? null,
            'status' => $p['status'] ?: 'Registered', 'currentBed' => $p['current_bed'], 'currentWard' => $p['current_ward'],
            'shaVerified' => (bool) $p['sha_verified'], 'shaAttendanceToken' => $p['sha_attendance_token'],
            'registeredDate' => $p['registered_date'], 'birthCertificateNo' => $p['birth_certificate_no'] ?? '',
            'kinRelationship' => $p['kin_relationship'] ?? '', 'branchId' => $p['branch_id'] ?? 1,
            'visitId' => $visit?->id, 'visitNumber' => $visit?->visit_number,
        ];
    }
}
