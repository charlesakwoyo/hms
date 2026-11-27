<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\GuardsPatientModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\QueuePaymentRequest;
use App\Http\Requests\QueueRouteRequest;
use App\Http\Requests\QueueStoreRequest;
use App\Services\QueueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class QueueController extends Controller
{
    use GuardsPatientModule;

    public function __construct(private QueueService $queue) {}

    public function store(QueueStoreRequest $request): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.route')) {
            return $this->denied();
        }

        try {
            $result = $this->queue->create((string) $request->input('patientId'), $request->all(), $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(array_merge(['success' => true, 'message' => 'Queue entry created.'], $result));
    }

    public function route(QueueRouteRequest $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.route')) {
            return $this->denied();
        }

        try {
            $result = $this->queue->route($queue, (string) $request->input('station'), $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function recordConsultationPayment(QueuePaymentRequest $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.payment')) {
            return $this->denied();
        }

        try {
            $result = $this->queue->recordConsultationPayment($queue, $request->validated(), $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function continueAfterPayment(Request $request, string $queue): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.route')) {
            return $this->denied();
        }

        try {
            $result = $this->queue->continueAfterPayment($queue, $this->moduleContext($request));
        } catch (RuntimeException $e) {
            return $this->error($e);
        }

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function status(Request $request, string $patient): JsonResponse
    {
        if (! $this->allowed($request->user(), 'queue.view')) {
            return $this->denied();
        }

        return response()->json(['success' => true, 'data' => $this->queue->status($patient)]);
    }

    private function error(RuntimeException $e): JsonResponse
    {
        $code = is_int($e->getCode()) ? $e->getCode() : 0;

        return response()->json(['success' => false, 'error' => $e->getMessage()], $code >= 400 && $code <= 599 ? $code : 422);
    }
}
