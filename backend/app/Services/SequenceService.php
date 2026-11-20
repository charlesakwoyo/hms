<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class SequenceService
{
    public function next(string $key, string $prefix): string
    {
        $row = DB::table('system_sequences')->where('sequence_key', $key)->lockForUpdate()->first();
        if (! $row) {
            DB::table('system_sequences')->insert(['sequence_key' => $key, 'next_value' => 1002]);

            return $prefix.'1001';
        }
        DB::table('system_sequences')->where('sequence_key', $key)->increment('next_value');

        return $prefix.(int) $row->next_value;
    }
}
