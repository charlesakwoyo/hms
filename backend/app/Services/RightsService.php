<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class RightsService
{
    public function rightsOf(User $user): array
    {
        $json = DB::table('security_roles')->whereRaw('LOWER(name) = LOWER(?)', [$user->role])->value('rights_json');
        $list = json_decode((string) $json, true);

        return is_array($list) ? array_values(array_filter($list, 'is_string')) : [];
    }

    public function has(User $user, array $rights): bool
    {
        if ($user->isAdministrator()) {
            return true;
        }

        return count(array_intersect($rights, $this->rightsOf($user))) > 0;
    }

    public function can(User $user, string $permission): bool
    {
        $rights = config('patients.rights', []);
        $needed = is_array($rights) ? ($rights[$permission] ?? [$permission]) : [$permission];

        return $this->has($user, is_array($needed) ? $needed : [$permission]);
    }

    public function canWrite(User $user, string $resource): bool
    {
        $needed = config("records.resources.$resource.write");
        if (! $needed) {
            return true;
        }

        return $this->has($user, $needed);
    }
}
