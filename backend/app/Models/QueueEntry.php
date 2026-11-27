<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueEntry extends Model
{
    protected $table = 'patient_queue';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'branch_id' => 'integer',
        'consultation_service_id' => 'integer',
        'scheme_id' => 'integer',
        'consultation_fee_paid' => 'boolean',
        'consultation_fee' => 'decimal:2',
        'call_count' => 'integer',
        'arrived_time' => 'datetime',
        'last_called_at' => 'datetime',
    ];
}
