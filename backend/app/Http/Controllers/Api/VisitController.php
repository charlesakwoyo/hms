<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\VisitStoreRequest;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VisitController extends Controller
{
    use GuardsPatientModule;

    public function __construct(private VisitService $visits) {}

    public function store(VisitStoreRequest $request, string $patient): JsonResponse
    {
        if (! $this->allowed($request->user(), 'visit.create')) {
            return $this->denied();
        }

        try {
            $visit = DB::transaction(fn () => $this->visits->open($patient, array_merge($request->all(), $this->moduleContext($request))));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $visit, 'message' => 'Visit opened.']);
    }

    public function cancel(Request $request, string $visit): JsonResponse
    {
        return $this->changeState($request, $visit, 'cancel');
    }

    public function close(Request $request, string $visit): JsonResponse
    {
        return $this->changeState($request, $visit, 'close');
    }

    private function changeState(Request $request, string $visit, string $action): JsonResponse
    {
        if (! $this->allowed($request->user(), 'visit.cancel')) {
            return $this->denied();
        }

        try {
            $result = DB::transaction(fn () => $action === 'cancel'
                ? $this->visits->cancel($visit, $this->moduleContext($request))
                : $this->visits->close($visit, $this->moduleContext($request)));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    private function error(RuntimeException $e): JsonResponse
    {
        $code = is_int($e->getCode()) ? $e->getCode() : 0;

        return response()->json(['success' => false, 'error' => $e->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
    }
}
