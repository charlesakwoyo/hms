<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\PatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class PatientController extends Controller
{
    public function __construct(private PatientService $patients, private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->patients->search(trim((string) $request->query('search', '')))]);
    }

    public function show(string $id): JsonResponse
    {
        $patient = $this->patients->find($id);

        return $patient
            ? response()->json(['success' => true, 'data' => $patient])
            : response()->json(['success' => false, 'error' => 'Patient not found.'], 404);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->save($request, true);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->save($request->merge(['id' => $id]), false);
    }

    private function save(Request $request, bool $isNew): JsonResponse
    {
        $data = $request->all();
        try {
            $result = $this->patients->save($data, $isNew);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 422);
        }
        $this->audit->record($request->user()->id, $isNew ? 'CREATE' : 'UPDATE', 'patients', $result['id'], $data, $request->ip());

        return response()->json(['success' => true, 'id' => $result['id'], 'visitId' => $result['visitId'], 'data' => $result['patient'], 'message' => 'Patient saved.']);
    }
}
