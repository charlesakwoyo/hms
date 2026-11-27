<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowEvent extends Model
{
    protected $table = 'workflow_events';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    const CREATED_AT = 'created_at';

    const UPDATED_AT = null;

    protected $casts = [
        'branch_id' => 'integer',
        'created_at' => 'datetime',
    ];
}
