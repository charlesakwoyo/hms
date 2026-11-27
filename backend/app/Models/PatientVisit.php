<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientVisit extends Model
{
    protected $table = 'patient_visits';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'branch_id' => 'integer',
        'department_id' => 'integer',
        'patient_category_id' => 'integer',
        'patient_sub_category_id' => 'integer',
        'scheme_id' => 'integer',
        'visit_date' => 'date:Y-m-d',
        'closed_at' => 'datetime',
    ];
}
