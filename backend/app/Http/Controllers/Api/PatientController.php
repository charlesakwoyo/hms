<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\PatientStoreRequest;
use App\Http\Requests\PatientUpdateRequest;
use App\Services\PatientNormalizer;
use App\Services\PatientService;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class PatientController extends Controller
{
    use GuardsPatientModule;

    public function __construct(
        private PatientService $patients,
        private VisitService $visits,
        private PatientNormalizer $normalizer
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.view')) {
            return $this->denied();
        }

        $filters = [
            'search' => $request->query('search', ''),
            'national_id' => $request->query('national_id', $request->query('nationalId', '')),
            'phone' => $request->query('phone', ''),
            'birth_certificate_no' => $request->query('birth_certificate_no', $request->query('birthCertificateNo', '')),
            'email' => $request->query('email', ''),
            'branch_id' => $request->query('branch_id', $request->query('branchId')),
            'status' => $request->query('status', ''),
            'patient_category_id' => $request->query('patient_category_id', $request->query('patientCategoryId')),
        ];
        $result = $this->patients->search($filters, (int) $request->query('per_page', 25), (int) $request->query('page', 1));

        return response()->json(array_merge(['success' => true], $result));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.view')) {
            return $this->denied();
        }
        $patient = $this->patients->detail($id);

        return $patient
            ? response()->json(['success' => true, 'data' => $patient])
            : response()->json(['success' => false, 'error' => 'Patient not found.'], 404);
    }

    public function store(PatientStoreRequest $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.create')) {
            return $this->denied();
        }

        $data = $request->all();
        $context = $this->moduleContext($request);
        $matches = $this->patients->duplicates($data);
        $token = (string) $request->input('duplicateOverrideToken', '');

        if ($token !== '') {
            $cacheKey = 'patient-duplicate-override:'.$token;
            $expected = $this->fingerprint($request);
            $stored = Cache::get($cacheKey);
            if (! is_string($stored) || ! hash_equals($expected, $stored)) {
                return response()->json(['success' => false, 'error' => 'The duplicate override confirmation has expired. Review the duplicates again.'], 409);
            }
            if (! $this->allowed($request->user(), 'patient.merge')) {
                return $this->denied();
            }
            Cache::forget($cacheKey);
        } elseif ($matches !== []) {
            if (! $this->allowed($request->user(), 'patient.merge')) {
                return $this->denied();
            }
            $overrideToken = Str::random(48);
            Cache::put('patient-duplicate-override:'.$overrideToken, $this->fingerprint($request), now()->addMinutes(10));

            return response()->json([
                'success' => false,
                'error' => 'Possible duplicate patient found. Confirm the override to continue.',
                'code' => 'duplicate_patient',
                'data' => ['matches' => $matches, 'overrideToken' => $overrideToken],
            ], 409);
        }

        try {
            $result = $this->patients->create($data, $context);
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json([
            'success' => true,
            'id' => $result['id'],
            'visitId' => $result['visitId'],
            'data' => $result['patient'],
            'message' => 'Patient registered.',
        ]);
    }

    public function update(PatientUpdateRequest $request, string $id): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.update')) {
            return $this->denied();
        }

        $data = $request->all();
        $data['id'] = $id;
        try {
            $result = $this->patients->update($id, $data, $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json([
            'success' => true,
            'id' => $result['id'],
            'data' => $result['patient'],
            'message' => 'Patient updated.',
        ]);
    }

    public function duplicateCheck(Request $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.view')) {
            return $this->denied();
        }

        return response()->json([
            'success' => true,
            'data' => $this->patients->duplicates($request->all(), $request->query('excludeId')),
        ]);
    }

    public function deactivate(Request $request, string $id): JsonResponse
    {
        return $this->changeStatus($request, $id, 'Inactive');
    }

    public function reactivate(Request $request, string $id): JsonResponse
    {
        return $this->changeStatus($request, $id, 'Active');
    }

    public function visits(Request $request, string $id): JsonResponse
    {
        if (! $this->allowed($request->user(), 'visit.view')) {
            return $this->denied();
        }

        return response()->json(['success' => true, 'data' => $this->visits->recent($id)]);
    }

    public function queueStatus(Request $request, string $id): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.view')) {
            return $this->denied();
        }

        return response()->json(['success' => true, 'data' => app(\App\Services\QueueService::class)->status($id)]);
    }

    public function activity(Request $request, string $id): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.view')) {
            return $this->denied();
        }

        return response()->json(['success' => true, 'data' => $this->patients->activity($id)]);
    }

    private function changeStatus(Request $request, string $id, string $status): JsonResponse
    {
        if (! $this->allowed($request->user(), 'patient.deactivate')) {
            return $this->denied();
        }

        try {
            $patient = $this->patients->setStatus($id, $status, $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $patient]);
    }

    private function fingerprint(Request $request): string
    {
        return hash('sha256', json_encode([
            $request->user()?->id,
            $this->normalizer->nameKey($request->input('name')),
            $this->normalizer->phone($request->input('phone')),
            $this->normalizer->date($request->input('dob')),
            $this->normalizer->identifier($request->input('nationalId')),
        ]));
    }

    private function error(RuntimeException $e): JsonResponse
    {
        $code = is_int($e->getCode()) ? $e->getCode() : 0;

        return response()->json(['success' => false, 'error' => $e->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
    }
}
