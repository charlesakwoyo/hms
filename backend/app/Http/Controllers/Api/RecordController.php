<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\RecordService;
use App\Services\RightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class RecordController extends Controller
{
    public function __construct(private RecordService $records, private RightsService $rights, private AuditService $audit) {}

    public function index(string $resource): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'entity' => $resource, 'data' => $this->records->list($resource)]);
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $data = $request->json()->all();
        if (! $data) {
            return response()->json(['success' => false, 'error' => 'Empty payload'], 400);
        }
        if (! $this->rights->canWrite($request->user(), $resource)) {
            return response()->json(['success' => false, 'error' => 'Your role cannot change these records. Ask the System Administrator.'], 403);
        }

        $isNew = ! $this->records->exists($resource, $data['id'] ?? null);

        try {
            $id = $this->records->save($resource, $data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
        $this->audit->record($request->user()->id, $isNew ? 'CREATE' : 'UPDATE', $resource, $id, $data, $request->ip());

        return response()->json(['success' => true, 'entity' => $resource, 'id' => $id, 'data' => $data]);
    }

    public function destroy(Request $request, string $resource, string $id): JsonResponse
    {
        if (! $this->rights->canWrite($request->user(), $resource)) {
            return response()->json(['success' => false, 'error' => 'Your role cannot change these records. Ask the System Administrator.'], 403);
        }

        try {
            $this->records->delete($resource, $id);
        } catch (InvalidArgumentException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 404);
        }
        $this->audit->record($request->user()->id, 'DELETE', $resource, $id, [], $request->ip());

        return response()->json(['success' => true, 'entity' => $resource, 'id' => $id]);
    }
}
