<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Throwable;

class BranchService
{
    public function resolve(mixed $requested = null): int
    {
        $candidate = (int) ($requested ?? 0);
        try {
            if ($candidate > 0 && DB::table('hospital_branches')->where('id', $candidate)->where('status', 'Active')->exists()) {
                return $candidate;
            }
            $id = DB::table('hospital_branches')->where('status', 'Active')->orderByDesc('is_default')->orderBy('id')->value('id');
            if ($id) {
                return (int) $id;
            }
        } catch (Throwable) {
        }

        return 1;
    }
}
