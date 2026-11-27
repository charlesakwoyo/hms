<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\User;
use App\Services\BranchService;
use App\Services\RightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

trait GuardsPatientModule
{
    private function denied(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'Your role cannot perform this patient action. Ask the System Administrator.',
        ], 403);
    }

    private function allowed(User $user, string $permission): bool
    {
        return app(RightsService::class)->can($user, $permission);
    }

    private function moduleContext(Request $request): array
    {
        $branch = $request->header('X-Branch-Id') ?? $request->input('branchId');

        return [
            'actor_id' => $request->user()?->id,
            'actor_name' => $request->user()?->full_name,
            'branch_id' => app(BranchService::class)->resolve($branch),
            'ip' => $request->ip(),
        ];
    }
}
