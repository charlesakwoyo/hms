<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'branch_id' => 'integer',
        'created_at' => 'datetime',
    ];

    const UPDATED_AT = null;
}
