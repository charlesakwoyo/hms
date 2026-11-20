<?php

namespace App\Support;

use Illuminate\Support\Str;

class Casing
{
    public static function toSnake(string $key): string
    {
        return Str::snake($key);
    }

    public static function toCamel(string $key): string
    {
        return Str::camel($key);
    }

    public static function camelKeys(array $row): array
    {
        $out = [];
        foreach ($row as $key => $value) {
            $out[self::toCamel((string) $key)] = $value;
        }

        return $out;
    }
}
