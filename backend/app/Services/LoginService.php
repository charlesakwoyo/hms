<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LoginService
{
    public const MAX_FAILURES = 5;

    public const LOCK_MINUTES = 15;

    public const IP_MAX_FAILURES = 20;

    private const WEAK = ['wisecare@2026', 'wisecare', 'password', 'password1', 'password123', 'admin', 'admin123', 'admin@123',
        '12345678', '123456789', '1234567890', 'qwerty123', 'welcome1', 'welcome123', 'hospital1', 'changeme', 'letmein1'];

    public function __construct(private AuditService $audit) {}

    public function attempt(string $username, string $password, string $ip, string $agent): User
    {
        $recentFailures = DB::table('auth_login_attempts')->where('ip', $ip)->where('success', 0)
            ->where('attempted_at', '>=', now()->subMinutes(self::LOCK_MINUTES))->count();
        if ($recentFailures >= self::IP_MAX_FAILURES) {
            $this->log($username, null, false, 'ip_blocked', $ip, $agent);
            throw new RuntimeException('Too many failed sign-ins from this computer. Try again in '.self::LOCK_MINUTES.' minutes.', 429);
        }

        $user = User::query()
            ->whereRaw('LOWER(username) = LOWER(?)', [$username])
            ->orWhere(fn ($q) => $q->whereNotNull('email')->where('email', '<>', '')->whereRaw('LOWER(email) = LOWER(?)', [$username]))
            ->first();
        $valid = password_verify($password, $user ? (string) $user->password_hash : password_hash('no such user', PASSWORD_DEFAULT));

        if ($user && $user->locked_until && strtotime((string) $user->locked_until) > time()) {
            $this->log($username, $user->id, false, 'locked', $ip, $agent);
            throw new RuntimeException('This account is locked after repeated wrong passwords. Try again after '.date('H:i', strtotime((string) $user->locked_until)).', or ask the System Administrator.', 423);
        }

        if (! $user || ! $valid) {
            if ($user) {
                $failures = (int) $user->failed_logins + 1;
                $lock = $failures >= self::MAX_FAILURES;
                $user->forceFill([
                    'failed_logins' => $lock ? 0 : $failures,
                    'locked_until' => $lock ? now()->addMinutes(self::LOCK_MINUTES) : $user->locked_until,
                ])->save();
                if ($lock) {
                    $this->audit->record($user->id, 'LOCK', 'users', $user->id, ['reason' => 'Repeated wrong passwords', 'ip' => $ip], $ip);
                }
            }
            $this->log($username, $user?->id, false, $user ? 'bad_password' : 'unknown_user', $ip, $agent);
            throw new RuntimeException('Invalid username or password.', 401);
        }

        if (! $user->isActive()) {
            $this->log($username, $user->id, false, 'inactive', $ip, $agent);
            throw new RuntimeException('This account is deactivated. Contact the System Administrator.', 403);
        }

        $mustChange = (int) $user->must_change_password === 1 || $this->passwordProblem($password, (string) $user->username, (string) $user->full_name) !== null;
        $user->forceFill([
            'failed_logins' => 0,
            'locked_until' => null,
            'last_login' => now(),
            'password_hash' => password_needs_rehash((string) $user->password_hash, PASSWORD_DEFAULT) ? password_hash($password, PASSWORD_DEFAULT) : $user->password_hash,
            'must_change_password' => $mustChange ? 1 : 0,
        ])->save();
        $this->log($username, $user->id, true, null, $ip, $agent);
        $this->audit->record($user->id, 'LOGIN', 'users', $user->id, ['ip' => $ip], $ip);

        return $user;
    }

    public function changePassword(User $user, string $current, string $new): void
    {
        if (! password_verify($current, (string) $user->password_hash)) {
            throw new RuntimeException('The current password is not right.', 400);
        }
        $problem = $this->passwordProblem($new, (string) $user->username, (string) $user->full_name);
        if ($problem) {
            throw new RuntimeException($problem, 400);
        }
        $user->forceFill([
            'password_hash' => password_hash($new, PASSWORD_DEFAULT),
            'must_change_password' => 0,
            'password_changed_at' => now(),
        ])->save();
    }

    public function passwordProblem(string $password, string $username = '', string $name = ''): ?string
    {
        $lower = strtolower($password);
        if (strlen($password) < 4) {
            return 'The password must have at least 4 characters.';
        }
        if (in_array($lower, self::WEAK, true)) {
            return 'This password is too common; choose another.';
        }
        if ($username !== '' && str_contains($lower, strtolower($username))) {
            return 'The password must not contain the username.';
        }
        foreach (preg_split('/\s+/', strtolower(trim($name))) as $part) {
            if (strlen($part) >= 4 && str_contains($lower, $part)) {
                return "The password must not contain the user's name.";
            }
        }

        return null;
    }

    private function log(string $username, ?string $userId, bool $success, ?string $reason, string $ip, string $agent): void
    {
        DB::table('auth_login_attempts')->insert([
            'username' => mb_substr($username, 0, 180),
            'user_id' => $userId,
            'ip' => $ip,
            'success' => $success ? 1 : 0,
            'reason' => $reason,
            'user_agent' => mb_substr($agent, 0, 255),
        ]);
    }
}
