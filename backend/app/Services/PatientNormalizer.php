<?php

namespace App\Services;

use Carbon\Carbon;
use Throwable;

class PatientNormalizer
{
    public function phone(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        if ($value === '') {
            return null;
        }
        if (str_starts_with($value, '+254')) {
            return '0'.substr($value, 4);
        }
        if (str_starts_with($value, '254')) {
            return '0'.substr($value, 3);
        }

        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return $digits !== '' ? $digits : null;
    }

    public function identifier(mixed $value): ?string
    {
        $value = strtoupper(trim((string) ($value ?? '')));

        return $value !== '' ? $value : null;
    }

    public function name(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        if ($value === '') {
            return null;
        }
        $value = (string) preg_replace('/\s+/', ' ', $value);

        return $value;
    }

    public function nameKey(mixed $value): ?string
    {
        $value = strtolower((string) preg_replace('/[^a-z0-9 ]+/i', ' ', (string) ($value ?? '')));
        $value = (string) preg_replace('/\s+/', ' ', trim($value));

        return $value !== '' ? $value : null;
    }

    public function email(mixed $value): ?string
    {
        $value = strtolower(trim((string) ($value ?? '')));

        return $value !== '' ? $value : null;
    }

    public function date(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }
        try {
            return Carbon::parse($value)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    public function age(mixed $dob, mixed $age = null): int
    {
        $dob = $this->date($dob);
        if ($dob) {
            try {
                return Carbon::parse($dob)->age;
            } catch (Throwable) {
            }
        }

        return max(0, min(130, (int) ($age ?? 0)));
    }
}
