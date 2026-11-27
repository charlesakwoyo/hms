<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const RIGHTS = [
        'patient:view', 'patient:create', 'patient:update', 'patient:deactivate',
        'visit:create', 'visit:view', 'visit:cancel', 'queue:view', 'queue:route',
        'patients:read', 'patients:create', 'patients:edit', 'queue:manage', 'queue:tv',
    ];

    public function up(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('security_roles')) {
            return;
        }

        foreach ($this->roles() as $role => $extraRights) {
            $rights = array_values(array_unique(array_merge(self::RIGHTS, $extraRights)));
            $id = 'patient-module-'.str_replace(' ', '-', strtolower($role));
            $existing = DB::table('security_roles')->whereRaw('LOWER(name) = LOWER(?)', [$role])->first();

            if (! $existing) {
                DB::table('security_roles')->insert([
                    'id' => $id,
                    'name' => $role,
                    'description' => 'Patient module rights',
                    'is_system' => 1,
                    'rights_json' => json_encode($rights),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                continue;
            }

            $current = json_decode((string) ($existing->rights_json ?? ''), true);
            $current = is_array($current) ? array_values(array_filter($current, 'is_string')) : [];
            $merged = array_values(array_unique(array_merge($current, $rights)));

            DB::table('security_roles')->where('id', $existing->id)->update([
                'rights_json' => json_encode($merged),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        if (! DB::getSchemaBuilder()->hasTable('security_roles')) {
            return;
        }

        foreach ($this->roles() as $role => $extraRights) {
            $seeded = array_values(array_unique(array_merge(self::RIGHTS, $extraRights)));
            $rows = DB::table('security_roles')->whereRaw('LOWER(name) = LOWER(?)', [$role])->get();

            foreach ($rows as $row) {
                if (str_starts_with((string) $row->id, 'patient-module-')) {
                    DB::table('security_roles')->where('id', $row->id)->delete();
                    continue;
                }

                $current = json_decode((string) ($row->rights_json ?? ''), true);
                $current = is_array($current) ? array_values(array_filter($current, 'is_string')) : [];
                $remaining = array_values(array_diff($current, $seeded));

                DB::table('security_roles')->where('id', $row->id)->update([
                    'rights_json' => json_encode($remaining),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function roles(): array
    {
        return [
            'System Administrator' => ['patient:merge'],
            'Receptionist' => [],
            'Triage Nurse' => ['triage:vitals'],
            'Medical Doctor' => ['consultation:read', 'consultation:write', 'consultation:diagnose'],
            'Billing Cashier' => ['billing:view', 'billing:create', 'billing:collect'],
            'Laboratory Technician' => ['lab:collect', 'lab:results', 'lab:approve'],
            'Radiologist' => ['radiology:report'],
            'Pharmacist' => ['pharmacy:dispense', 'pharmacy:otc'],
        ];
    }
};
