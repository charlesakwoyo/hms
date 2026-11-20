<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\LoginService;
use App\Services\RightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;

class AuthController extends Controller
{
    public function __construct(private LoginService $login, private RightsService $rights, private AuditService $audit) {}

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:180'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        try {
            $user = $this->login->attempt(trim($data['username']), $data['password'], (string) $request->ip(), (string) $request->userAgent());
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 401);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json(['success' => true, 'user' => $user->toClient(), 'rights' => $this->rights->rightsOf($user)]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['success' => true, 'user' => $user->toClient(), 'rights' => $this->rights->rightsOf($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $this->audit->record($user->id, 'LOGOUT', 'users', $user->id, [], $request->ip());
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'max:255'],
        ]);

        try {
            $this->login->changePassword($request->user(), $data['currentPassword'], $data['newPassword']);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], $e->getCode() ?: 400);
        }

        return response()->json(['success' => true, 'user' => $request->user()->fresh()->toClient()]);
    }
}
