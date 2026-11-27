<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

class PatientService
{
    private const KNOWN_FIELDS = [
        'name', 'fullName', 'dob', 'age', 'gender', 'phone', 'email', 'nationalId', 'birthCertificateNo',
        'address', 'emergencyContact', 'emergencyPhone', 'kinRelationship', 'bloodGroup', 'allergies',
        'insuranceProvider', 'insuranceScheme', 'insurancePolicyNo', 'insuranceNumber',
        'patientCategory', 'patientSubCategory', 'patientCategoryId', 'patientSubCategoryId', 'schemeId',
        'status', 'registeredDate', 'branchId', 'registrationSource', 'registeredBy',
        'shaVerified', 'shaAttendanceToken', 'currentBed', 'currentWard',
        'visitId', 'visitNumber', 'appointmentId', 'departmentId', 'consultationServiceId',
        'source', 'encounterType', 'visitType', 'practitionerId', 'notes', 'newVisit',
        'duplicateOverrideToken', 'duplicateOverrideReason', 'overrideConfirmed',
    ];

    public function __construct(
        private SequenceService $sequences,
        private BranchService $branches,
        private VisitService $visits,
        private PatientNormalizer $normalizer,
        private AuditService $audit
    ) {}

    public function search(array $filters = [], int $perPage = 25, int $page = 1): array
    {
        $perPage = max(1, min(100, $perPage));
        $page = max(1, $page);

        $query = DB::table('patients')
            ->select('patients.*')
            ->selectSub(DB::table('hospital_branches')->select('name')->whereColumn('hospital_branches.id', 'patients.branch_id')->limit(1), 'branch_name')
            ->selectSub(DB::table('setup_patient_categories')->select('name')->whereColumn('setup_patient_categories.id', 'patients.patient_category_id')->limit(1), 'category_name')
            ->selectSub(DB::table('setup_patient_schemes')->select('scheme_name')->whereColumn('setup_patient_schemes.id', 'patients.scheme_id')->limit(1), 'scheme_name')
            ->orderByDesc('patients.created_at')->orderByDesc('patients.id');

        $term = trim((string) ($filters['search'] ?? ''));
        if ($term !== '') {
            $like = '%'.$term.'%';
            $phone = $this->normalizer->phone($term);
            $identifier = $this->normalizer->identifier($term);
            $query->where(function ($q) use ($like, $phone, $identifier) {
                $q->where('patients.full_name', 'like', $like)
                    ->orWhere('patients.id', 'like', $like)
                    ->orWhere('patients.phone', 'like', $like)
                    ->orWhere('patients.national_id', 'like', $like)
                    ->orWhere('patients.birth_certificate_no', 'like', $like)
                    ->orWhere('patients.email', 'like', $like);
                if ($phone) {
                    $q->orWhere('patients.phone_normalized', 'like', '%'.$phone.'%');
                }
                if ($identifier) {
                    $q->orWhere('patients.national_id_normalized', 'like', '%'.$identifier.'%');
                }
            });
        }

        foreach ([
            'national_id' => 'national_id_normalized',
            'phone' => 'phone_normalized',
            'birth_certificate_no' => 'birth_certificate_no',
            'email' => 'email',
        ] as $filter => $column) {
            $value = trim((string) ($filters[$filter] ?? ''));
            if ($value === '') {
                continue;
            }
            if (in_array($column, ['national_id_normalized', 'phone_normalized'], true)) {
                $value = $column === 'phone_normalized' ? (string) $this->normalizer->phone($value) : (string) $this->normalizer->identifier($value);
            }
            $query->where($column, $value);
        }

        if (! empty($filters['branch_id'])) {
            $query->where('patients.branch_id', (int) $filters['branch_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('patients.status', (string) $filters['status']);
        }
        if (! empty($filters['patient_category_id'])) {
            $query->where('patients.patient_category_id', (int) $filters['patient_category_id']);
        }

        $paginator = $query->paginate($perPage, ['patients.*'], 'page', $page);
        $rows = collect($paginator->items())->map(fn ($row) => $this->toClient((array) $row))->all();

        return [
            'data' => $rows,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function find(string $id): ?array
    {
        $row = $this->baseQuery()->where('patients.id', $id)->first();

        return $row ? $this->toClient((array) $row) : null;
    }

    public function detail(string $id): ?array
    {
        $patient = $this->find($id);
        if (! $patient) {
            return null;
        }

        $active = $this->visits->active($id);
        $queue = DB::table('patient_queue')->where('patient_id', $id)
            ->whereNotIn('current_station', ['Discharged'])
            ->orderByDesc('arrived_time')->first();

        return array_merge($patient, [
            'activeVisits' => $active ? [[
                'id' => (string) $active['id'],
                'visitId' => (string) $active['id'],
                'visitNumber' => (string) ($active['visit_number'] ?? ''),
                'status' => $active['status'] ?? null,
            ]] : [],
            'recentVisits' => $this->visits->recent($id),
            'queueStatus' => $queue ? [
                'id' => (string) $queue->id,
                'ticketNumber' => (string) ($queue->ticket_number ?? ''),
                'currentStation' => $queue->current_station ?? null,
                'status' => $queue->status ?? null,
            ] : null,
        ]);
    }

    public function duplicates(array $data, ?string $excludeId = null): array
    {
        $national = $this->normalizer->identifier($data['nationalId'] ?? null);
        $phone = $this->normalizer->phone($data['phone'] ?? null);
        $dob = $this->normalizer->date($data['dob'] ?? null);
        $name = $this->normalizer->name($data['name'] ?? $data['fullName'] ?? null);
        $nameKey = $this->normalizer->nameKey($name);

        if ($national === null && $phone === null && ($nameKey === null || $dob === null)) {
            return [];
        }

        $query = DB::table('patients')->select('patients.*')
            ->selectSub(
                DB::table('patient_visits')->select('visit_date')->whereColumn('patient_visits.patient_id', 'patients.id')
                    ->orderByDesc('visit_date')->limit(1),
                'last_visit_date'
            );
        if ($excludeId) {
            $query->where('patients.id', '!=', $excludeId);
        }

        $nationalIdExists = Schema::hasColumn('patients', 'national_id_normalized');
        $phoneExists = Schema::hasColumn('patients', 'phone_normalized');
        $nameExists = Schema::hasColumn('patients', 'full_name_normalized');

        $query->where(function ($q) use ($national, $phone, $dob, $name, $nameKey, $nationalIdExists, $phoneExists, $nameExists) {
            $matched = false;
            if ($national !== null) {
                $q->orWhere($nationalIdExists ? 'patients.national_id_normalized' : 'patients.national_id', $national);
                $matched = true;
            }
            if ($phone !== null) {
                $q->orWhere($phoneExists ? 'patients.phone_normalized' : 'patients.phone', $phone);
                $matched = true;
            }
            if ($nameKey !== null && $dob !== null && $nameExists) {
                $q->orWhere(function ($inner) use ($nameKey, $dob) {
                    $inner->where('patients.full_name_normalized', $nameKey)->where('patients.dob', $dob);
                });
                $matched = true;
            }
            if ($name !== null) {
                $q->orWhere(function ($inner) use ($name, $dob) {
                    $inner->whereRaw('SOUNDEX(patients.full_name) = SOUNDEX(?)', [$name]);
                    if ($dob !== null) {
                        $inner->whereRaw('ABS(DATEDIFF(patients.dob, ?)) <= 2', [$dob]);
                    }
                });
                $matched = true;
            }
            if (! $matched) {
                $q->whereRaw('1 = 0');
            }
        });

        $rows = $query->limit(25)->get();
        $matches = [];

        foreach ($rows as $row) {
            $reasons = [];
            $nationalValue = $nationalIdExists ? ($row->national_id_normalized ?? null) : $this->normalizer->identifier($row->national_id);
            $phoneValue = $phoneExists ? ($row->phone_normalized ?? null) : $this->normalizer->phone($row->phone);
            $nameValue = $nameExists ? ($row->full_name_normalized ?? null) : $this->normalizer->nameKey($row->full_name);

            if ($national !== null && $nationalValue === $national) {
                $reasons[] = 'Exact national ID';
            }
            if ($phone !== null && $phoneValue === $phone) {
                $reasons[] = 'Exact phone';
            }
            if ($nameKey !== null && $dob !== null && $nameValue === $nameKey && $row->dob === $dob) {
                $reasons[] = 'Exact name and date of birth';
            }
            if ($reasons === [] && $name !== null) {
                $reasons[] = 'Similar name';
            }

            $matches[] = [
                'id' => (string) $row->id,
                'patientNumber' => (string) $row->id,
                'name' => (string) $row->full_name,
                'phone' => (string) ($row->phone ?? ''),
                'dob' => $row->dob,
                'nationalId' => $row->national_id,
                'lastVisit' => $row->last_visit_date,
                'reasons' => $reasons,
            ];
        }

        return $matches;
    }

    public function create(array $data, array $context = []): array
    {
        $this->assertKnownFields($data, false);
        if (array_key_exists('id', $data)) {
            throw new RuntimeException('Patient number is generated by the server.', 422);
        }

        return DB::transaction(function () use ($data, $context) {
            $name = $this->normalizer->name($data['name'] ?? $data['fullName'] ?? null);
            $phone = $this->normalizer->phone($data['phone'] ?? null);
            $dob = $this->normalizer->date($data['dob'] ?? null);
            $age = $this->normalizer->age($dob, $data['age'] ?? null);
            $gender = trim((string) ($data['gender'] ?? ''));
            $national = $this->normalizer->identifier($data['nationalId'] ?? null);
            $birthCertificate = $this->normalizer->identifier($data['birthCertificateNo'] ?? null);

            if (! $name) {
                throw new RuntimeException('Full name is required.', 422);
            }
            if (! $phone) {
                throw new RuntimeException('A valid phone number is required.', 422);
            }
            if (! in_array($gender, ['Male', 'Female', 'Other'], true)) {
                throw new RuntimeException('Gender is required.', 422);
            }
            if (! $dob && ! array_key_exists('age', $data)) {
                throw new RuntimeException('Date of birth or age is required.', 422);
            }
            if (config('patients.require_identifier', false) && $national === null && $birthCertificate === null) {
                throw new RuntimeException('A national ID or birth certificate number is required.', 422);
            }
            if ($age < 18) {
                foreach (['emergencyContact', 'emergencyPhone', 'kinRelationship'] as $field) {
                    if (trim((string) ($data[$field] ?? '')) === '') {
                        throw new RuntimeException('This patient is a child. Enter the parent or guardian name, phone number and relationship.', 422);
                    }
                }
            }

            $ids = $this->resolveLookups($data, true);
            $branchId = $this->branches->resolve($data['branchId'] ?? ($context['branch_id'] ?? null));
            $status = (string) ($data['status'] ?? 'Registered');
            if (! in_array($status, config('patients.statuses', []), true)) {
                throw new RuntimeException('Invalid patient status.', 422);
            }

            $id = $this->sequences->next(config('patients.sequences.patient', 'PATIENT'), 'P-');
            $row = $this->patientRow($data, [
                'id' => $id,
                'name' => $name,
                'phone' => $phone,
                'dob' => $dob,
                'age' => $age,
                'national' => $national,
                'birthCertificate' => $birthCertificate,
                'ids' => $ids,
                'branchId' => $branchId,
                'status' => $status,
                'actorId' => $context['actor_id'] ?? null,
            ]);

            DB::table('patients')->insert($row);
            $this->storeCopy($id, $data, $row);

            $visit = $this->visits->open($id, array_merge($data, [
                'source' => $data['source'] ?? 'Registration',
                'branchId' => $branchId,
                'patientCategoryId' => $ids['patient_category_id'],
                'patientSubCategoryId' => $ids['patient_sub_category_id'],
                'schemeId' => $ids['scheme_id'],
            ], $context));

            $details = ['registration_source' => $row['registration_source']];
            if (! empty($data['duplicateOverrideToken'])) {
                $details['duplicate_override_reason'] = $data['duplicateOverrideReason'] ?? null;
                $this->audit->record(
                    $context['actor_id'] ?? null,
                    'DUPLICATE_OVERRIDE',
                    'patients',
                    $id,
                    $details,
                    $context['ip'] ?? null,
                    $branchId,
                    [],
                    ['name' => $name, 'phone' => $phone, 'national_id' => $national]
                );
            }

            $this->audit->record(
                $context['actor_id'] ?? null,
                'PATIENT_IDENTIFIER_ASSIGNED',
                'patients',
                $id,
                ['identifier' => $id, 'source' => 'system_sequences'],
                $context['ip'] ?? null,
                $branchId
            );
            $this->audit->record(
                $context['actor_id'] ?? null,
                'PATIENT_CREATED',
                'patients',
                $id,
                $details,
                $context['ip'] ?? null,
                $branchId,
                [],
                $row
            );

            return ['id' => $id, 'visitId' => $visit['id'], 'patient' => $this->find($id)];
        });
    }

    public function update(string $id, array $data, array $context = []): array
    {
        $this->assertKnownFields($data, true);
        if (array_key_exists('id', $data) && (string) $data['id'] !== $id) {
            throw new RuntimeException('Patient number cannot be changed.', 422);
        }

        return DB::transaction(function () use ($id, $data, $context) {
            $existing = DB::table('patients')->where('id', $id)->first();
            if (! $existing) {
                throw new RuntimeException('Patient not found.', 404);
            }

            $changes = [];
            foreach ([
                'name' => 'full_name', 'fullName' => 'full_name', 'email' => 'email', 'address' => 'address',
                'emergencyContact' => 'emergency_contact', 'emergencyPhone' => 'emergency_phone',
                'kinRelationship' => 'kin_relationship', 'bloodGroup' => 'blood_group', 'allergies' => 'allergies',
                'insuranceProvider' => 'insurance_provider', 'insuranceScheme' => 'insurance_scheme',
                'insurancePolicyNo' => 'insurance_policy_no', 'insuranceNumber' => 'insurance_number',
                'patientCategory' => 'patient_category', 'patientSubCategory' => 'patient_sub_category',
                'shaVerified' => 'sha_verified', 'shaAttendanceToken' => 'sha_attendance_token',
                'currentBed' => 'current_bed', 'currentWard' => 'current_ward',
            ] as $field => $column) {
                if (array_key_exists($field, $data)) {
                    $changes[$column] = $data[$field];
                }
            }

            if (array_key_exists('name', $data) || array_key_exists('fullName', $data)) {
                $name = $this->normalizer->name($data['name'] ?? $data['fullName'] ?? null);
                if (! $name) {
                    throw new RuntimeException('Full name is required.', 422);
                }
                $changes['full_name'] = $name;
                if (Schema::hasColumn('patients', 'full_name_normalized')) {
                    $changes['full_name_normalized'] = $this->normalizer->nameKey($name);
                }
            }
            if (array_key_exists('phone', $data)) {
                $phone = $this->normalizer->phone($data['phone']);
                if (! $phone) {
                    throw new RuntimeException('A valid phone number is required.', 422);
                }
                $changes['phone'] = $data['phone'];
                if (Schema::hasColumn('patients', 'phone_normalized')) {
                    $changes['phone_normalized'] = $phone;
                }
            }
            if (array_key_exists('nationalId', $data)) {
                $changes['national_id'] = $this->normalizer->identifier($data['nationalId']);
                if (Schema::hasColumn('patients', 'national_id_normalized')) {
                    $changes['national_id_normalized'] = $changes['national_id'];
                }
            }
            if (array_key_exists('birthCertificateNo', $data)) {
                $changes['birth_certificate_no'] = $this->normalizer->identifier($data['birthCertificateNo']);
            }
            if (array_key_exists('dob', $data)) {
                $dob = $this->normalizer->date($data['dob']);
                if (! $dob) {
                    throw new RuntimeException('Invalid date of birth.', 422);
                }
                $changes['dob'] = $dob;
                $changes['age'] = $this->normalizer->age($dob, null);
            } elseif (array_key_exists('age', $data)) {
                $changes['age'] = max(0, min(130, (int) $data['age']));
            }
            if (array_key_exists('gender', $data)) {
                if (! in_array($data['gender'], ['Male', 'Female', 'Other'], true)) {
                    throw new RuntimeException('Invalid gender.', 422);
                }
                $changes['gender'] = $data['gender'];
            }

            $lookupKeys = ['patientCategoryId', 'patientSubCategoryId', 'schemeId', 'patientCategory', 'patientSubCategory', 'insuranceScheme'];
            if (collect($lookupKeys)->contains(fn ($key) => array_key_exists($key, $data))) {
                $merged = array_merge((array) $existing, $data);
                $changes = array_merge($changes, $this->resolveLookups($merged, false));
            }

            if (array_key_exists('branchId', $data)) {
                $changes['branch_id'] = $this->branches->resolve($data['branchId']);
            }
            if (array_key_exists('registeredDate', $data)) {
                $changes['registered_date'] = $this->normalizer->date($data['registeredDate']);
            }
            if (array_key_exists('status', $data)) {
                if (! in_array($data['status'], config('patients.statuses', []), true)) {
                    throw new RuntimeException('Invalid patient status.', 422);
                }
                $changes['status'] = $data['status'];
            }

            $changes = array_filter($changes, fn ($value, $key) => $value !== ($existing->{$key} ?? null), ARRAY_FILTER_USE_BOTH);
            if ($changes !== []) {
                DB::table('patients')->where('id', $id)->update($changes);
            }

            $copy = json_decode((string) (DB::table('entity_store')->where('entity_type', 'patients')->where('entity_id', $id)->value('data_json') ?? '{}'), true);
            $copy = is_array($copy) ? $copy : [];
            $this->storeCopy($id, array_merge($copy, $data), array_merge((array) $existing, $changes));

            $oldValues = [];
            $newValues = [];
            foreach ($changes as $key => $value) {
                $oldValues[$key] = $existing->{$key} ?? null;
                $newValues[$key] = $value;
            }
            $this->audit->record(
                $context['actor_id'] ?? null,
                'PATIENT_UPDATED',
                'patients',
                $id,
                [],
                $context['ip'] ?? null,
                (int) ($context['branch_id'] ?? $existing->branch_id ?? 1),
                $oldValues,
                $newValues
            );

            return ['id' => $id, 'patient' => $this->find($id)];
        });
    }

    public function setStatus(string $id, string $status, array $context = []): array
    {
        return DB::transaction(function () use ($id, $status, $context) {
            $existing = DB::table('patients')->where('id', $id)->first();
            if (! $existing) {
                throw new RuntimeException('Patient not found.', 404);
            }
            if (! in_array($status, config('patients.statuses', []), true)) {
                throw new RuntimeException('Invalid patient status.', 422);
            }

            DB::table('patients')->where('id', $id)->update(['status' => $status]);
            $this->audit->record(
                $context['actor_id'] ?? null,
                $status === 'Inactive' ? 'PATIENT_DEACTIVATED' : 'PATIENT_REACTIVATED',
                'patients',
                $id,
                [],
                $context['ip'] ?? null,
                (int) ($context['branch_id'] ?? $existing->branch_id ?? 1),
                ['status' => $existing->status],
                ['status' => $status]
            );

            return $this->find($id);
        });
    }

    public function activity(string $id, int $limit = 50): array
    {
        return DB::table('audit_log')->where(function ($query) use ($id) {
            $query->where('entity_type', 'patients')->where('entity_id', $id)
                ->orWhere('entity_type', 'patient_visits')->where('details_json', 'like', '%'.$id.'%')
                ->orWhere('entity_type', 'patient_queue')->where('details_json', 'like', '%'.$id.'%');
        })->orderByDesc('created_at')->limit($limit)
            ->get()->map(fn ($row) => (array) $row)->all();
    }

    public function save(array $data, bool $isNew): array
    {
        $context = ['actor_id' => null, 'branch_id' => null, 'ip' => null];

        return $isNew ? $this->create($data, $context) : $this->update((string) ($data['id'] ?? ''), $data, $context);
    }

    private function baseQuery()
    {
        return DB::table('patients')
            ->select('patients.*')
            ->selectSub(DB::table('hospital_branches')->select('name')->whereColumn('hospital_branches.id', 'patients.branch_id')->limit(1), 'branch_name')
            ->selectSub(DB::table('setup_patient_categories')->select('name')->whereColumn('setup_patient_categories.id', 'patients.patient_category_id')->limit(1), 'category_name')
            ->selectSub(DB::table('setup_patient_schemes')->select('scheme_name')->whereColumn('setup_patient_schemes.id', 'patients.scheme_id')->limit(1), 'scheme_name');
    }

    private function patientRow(array $data, array $normalized): array
    {
        $ids = $normalized['ids'];

        return [
            'id' => $normalized['id'],
            'full_name' => $normalized['name'],
            'age' => $normalized['age'],
            'dob' => $normalized['dob'],
            'gender' => $normalized['gender'] ?? 'Male',
            'phone' => $data['phone'],
            'email' => $this->normalizer->email($data['email'] ?? null),
            'national_id' => $normalized['national'],
            'birth_certificate_no' => $normalized['birthCertificate'],
            'address' => $data['address'] ?? null,
            'emergency_contact' => $data['emergencyContact'] ?? null,
            'emergency_phone' => $data['emergencyPhone'] ?? null,
            'kin_relationship' => $data['kinRelationship'] ?? null,
            'blood_group' => $data['bloodGroup'] ?? null,
            'allergies' => $data['allergies'] ?? null,
            'insurance_provider' => $data['insuranceProvider'] ?? 'Cash / M-Pesa',
            'insurance_scheme' => $data['insuranceScheme'] ?? null,
            'insurance_policy_no' => $data['insurancePolicyNo'] ?? null,
            'insurance_number' => $data['insuranceNumber'] ?? null,
            'patient_category' => $data['patientCategory'] ?? null,
            'patient_sub_category' => $data['patientSubCategory'] ?? null,
            'patient_category_id' => $ids['patient_category_id'],
            'patient_sub_category_id' => $ids['patient_sub_category_id'],
            'scheme_id' => $ids['scheme_id'],
            'status' => $normalized['status'],
            'current_bed' => $data['currentBed'] ?? null,
            'current_ward' => $data['currentWard'] ?? null,
            'sha_verified' => ! empty($data['shaVerified']) ? 1 : 0,
            'sha_attendance_token' => $data['shaAttendanceToken'] ?? null,
            'registered_date' => $this->normalizer->date($data['registeredDate'] ?? null) ?? now()->toDateString(),
            'branch_id' => $normalized['branchId'],
            'registered_by' => $normalized['actorId'],
            'registration_source' => $data['registrationSource'] ?? 'Registration',
            'phone_normalized' => $normalized['phone'],
            'national_id_normalized' => $normalized['national'],
            'full_name_normalized' => $this->normalizer->nameKey($normalized['name']),
        ];
    }

    private function resolveLookups(array $data, bool $required): array
    {
        $categoryId = $data['patientCategoryId'] ?? null;
        if (! $categoryId && ! empty($data['patientCategory'])) {
            $categoryId = DB::table('setup_patient_categories')
                ->where('name', $data['patientCategory'])->orWhere('code', $data['patientCategory'])->value('id');
        }
        if ($required && ! $categoryId) {
            throw new RuntimeException('Patient category or type is required.', 422);
        }
        if ($categoryId && ! DB::table('setup_patient_categories')->where('id', $categoryId)->exists()) {
            throw new RuntimeException('Patient category was not found.', 422);
        }

        $subCategoryId = $data['patientSubCategoryId'] ?? null;
        if (! $subCategoryId && ! empty($data['patientSubCategory'])) {
            $subCategoryId = DB::table('setup_patient_subcategories')
                ->where('name', $data['patientSubCategory'])->orWhere('sub_category_code', $data['patientSubCategory'])->value('id');
        }
        if ($subCategoryId && ! DB::table('setup_patient_subcategories')->where('id', $subCategoryId)->exists()) {
            throw new RuntimeException('Patient sub-category was not found.', 422);
        }
        if ($subCategoryId && $categoryId) {
            $owner = DB::table('setup_patient_subcategories')->where('id', $subCategoryId)->value('category_id');
            if ($owner && (string) $owner !== (string) $categoryId) {
                throw new RuntimeException('Patient sub-category does not belong to the selected category.', 422);
            }
        }

        $schemeId = $data['schemeId'] ?? null;
        if (! $schemeId && ! empty($data['insuranceScheme'])) {
            $schemeId = DB::table('setup_patient_schemes')->where('scheme_name', $data['insuranceScheme'])->value('id');
        }
        if ($schemeId && ! DB::table('setup_patient_schemes')->where('id', $schemeId)->exists()) {
            throw new RuntimeException('Patient scheme was not found.', 422);
        }
        if ($schemeId && $subCategoryId) {
            $owner = DB::table('setup_patient_schemes')->where('id', $schemeId)->value('sub_category_id');
            if ($owner && (string) $owner !== (string) $subCategoryId) {
                throw new RuntimeException('Patient scheme does not belong to the selected sub-category.', 422);
            }
        }

        return [
            'patient_category_id' => $categoryId,
            'patient_sub_category_id' => $subCategoryId,
            'scheme_id' => $schemeId,
        ];
    }

    private function storeCopy(string $id, array $data, array $row): void
    {
        $copy = array_merge($data, [
            'id' => $id,
            'patientCategoryId' => $row['patient_category_id'] ?? null,
            'patientSubCategoryId' => $row['patient_sub_category_id'] ?? null,
            'schemeId' => $row['scheme_id'] ?? null,
            'branchId' => $row['branch_id'] ?? null,
        ]);

        DB::table('entity_store')->updateOrInsert(
            ['entity_type' => 'patients', 'entity_id' => $id],
            ['patient_id' => $id, 'data_json' => json_encode($copy, JSON_UNESCAPED_UNICODE)]
        );
    }

    private function assertKnownFields(array $data, bool $allowId): void
    {
        $known = self::KNOWN_FIELDS;
        if ($allowId) {
            $known[] = 'id';
        }
        $unknown = array_values(array_diff(array_keys($data), $known));
        if ($unknown !== []) {
            throw new RuntimeException('Unknown patient fields: '.implode(', ', $unknown), 422);
        }
    }

    private function toClient(array $p): array
    {
        $age = $this->normalizer->age($p['dob'] ?? null, $p['age'] ?? null);
        $active = DB::table('patient_visits')->where('patient_id', $p['id'])
            ->whereIn('status', config('patients.active_visit_statuses', ['Open', 'In Progress']))
            ->orderByDesc('visit_date')->orderByDesc('created_at')
            ->first(['id', 'visit_number', 'status']);
        $queue = DB::table('patient_queue')->where('patient_id', $p['id'])
            ->whereNotIn('current_station', ['Discharged'])
            ->orderByDesc('arrived_time')->first(['id', 'ticket_number', 'current_station', 'status']);

        return [
            'id' => (string) $p['id'],
            'patientNumber' => (string) $p['id'],
            'name' => (string) $p['full_name'],
            'fullName' => (string) $p['full_name'],
            'age' => $age,
            'dob' => $p['dob'] ?? null,
            'gender' => $p['gender'],
            'phone' => (string) ($p['phone'] ?? ''),
            'email' => $p['email'] ?? null,
            'nationalId' => $p['national_id'] ?? null,
            'birthCertificateNo' => $p['birth_certificate_no'] ?? null,
            'address' => $p['address'] ?? null,
            'emergencyContact' => $p['emergency_contact'] ?? null,
            'emergencyPhone' => $p['emergency_phone'] ?? null,
            'kinRelationship' => $p['kin_relationship'] ?? null,
            'bloodGroup' => $p['blood_group'] ?: 'O+',
            'allergies' => $p['allergies'] ?: 'None',
            'insuranceProvider' => $p['insurance_provider'] ?: 'Cash / M-Pesa',
            'insuranceScheme' => $p['insurance_scheme'] ?? '',
            'insurancePolicyNo' => $p['insurance_policy_no'] ?? '',
            'insuranceNumber' => $p['insurance_number'] ?? '',
            'patientCategory' => $p['patient_category'] ?? '',
            'patientSubCategory' => $p['patient_sub_category'] ?? '',
            'patientCategoryId' => $p['patient_category_id'] ?? null,
            'patientSubCategoryId' => $p['patient_sub_category_id'] ?? null,
            'schemeId' => $p['scheme_id'] ?? null,
            'categoryName' => $p['category_name'] ?? null,
            'schemeName' => $p['scheme_name'] ?? null,
            'branchName' => $p['branch_name'] ?? null,
            'status' => $p['status'] ?: 'Registered',
            'currentBed' => $p['current_bed'] ?? null,
            'currentWard' => $p['current_ward'] ?? null,
            'shaVerified' => (bool) ($p['sha_verified'] ?? false),
            'shaAttendanceToken' => $p['sha_attendance_token'] ?? null,
            'registeredDate' => $p['registered_date'] ?? null,
            'registeredBy' => $p['registered_by'] ?? null,
            'registrationSource' => $p['registration_source'] ?? null,
            'branchId' => $p['branch_id'] ?? 1,
            'visitId' => $active?->id,
            'visitNumber' => $active?->visit_number,
            'visitStatus' => $active?->status,
            'queueStatus' => $queue ? [
                'id' => $queue->id,
                'ticketNumber' => $queue->ticket_number,
                'currentStation' => $queue->current_station,
                'status' => $queue->status,
            ] : null,
        ];
    }
}
