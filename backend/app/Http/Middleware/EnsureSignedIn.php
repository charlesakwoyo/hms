<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSignedIn
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user();
        if (! $user || ! $user->isActive()) {
            Auth::guard('web')->logout();

            return response()->json(['success' => false, 'error' => 'Sign in to continue.', 'code' => 'auth.required'], 401);
        }

        return $next($request);
    }
}
