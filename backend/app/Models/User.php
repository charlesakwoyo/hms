<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $table = 'users';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected $hidden = ['password_hash', 'failed_logins', 'locked_until', 'remember_token'];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function getRememberTokenName(): string
    {
        return '';
    }

    public function isActive(): bool
    {
        return strcasecmp((string) $this->status, 'Active') === 0;
    }

    public function isAdministrator(): bool
    {
        return $this->role === config('records.admin_role');
    }

    public function toClient(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->full_name,
            'email' => (string) $this->email,
            'role' => $this->role,
            'department' => (string) $this->department,
            'phone' => (string) $this->phone,
            'mustChangePassword' => (bool) $this->must_change_password,
        ];
    }
}
