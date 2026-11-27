<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $table = 'patients';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'age' => 'integer',
        'dob' => 'date:Y-m-d',
        'registered_date' => 'date:Y-m-d',
        'branch_id' => 'integer',
        'patient_category_id' => 'integer',
        'patient_sub_category_id' => 'integer',
        'scheme_id' => 'integer',
        'sha_verified' => 'boolean',
    ];
}
