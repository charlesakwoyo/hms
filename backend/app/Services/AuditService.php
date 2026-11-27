<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Throwable;

class AuditService
{
    private const HIDDEN = '/password|passwd|passkey|secret|api_?key|private_?key|token$/i';

    public function record(
        ?string $userId,
        string $action,
        string $entity,
        ?string $entityId,
        array $details = [],
        ?string $ip = null,
        ?int $branchId = null,
        array $old = [],
        array $new = []
    ): void {
        try {
            $payload = $details;
            if ($old !== []) {
                $payload['old'] = $old;
            }
            if ($new !== []) {
                $payload['new'] = $new;
            }

            DB::table('audit_log')->insert([
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entity,
                'entity_id' => $entityId,
                'details_json' => json_encode($this->scrub($payload), JSON_UNESCAPED_UNICODE),
                'ip_address' => $ip,
                'branch_id' => $branchId,
            ]);
        } catch (Throwable) {
        }
    }

    public function scrub(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match(self::HIDDEN, $key)) {
                $out[$key] = ($value === null || $value === '') ? $value : '[hidden]';
            } elseif (is_array($value)) {
                $out[$key] = $this->scrub($value);
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
