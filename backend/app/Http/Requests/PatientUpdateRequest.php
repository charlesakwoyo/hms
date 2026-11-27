<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['sometimes', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:180'],
            'dob' => ['nullable', 'date', 'before_or_equal:today', 'required_without:age'],
            'age' => ['nullable', 'integer', 'min:0', 'max:130', 'required_without:dob'],
            'gender' => ['required', Rule::in(['Male', 'Female', 'Other'])],
            'phone' => ['required', 'string', 'max:50', 'regex:/^[0-9+()\s-]{7,30}$/'],
            'email' => ['nullable', 'email', 'max:180'],
            'nationalId' => ['nullable', 'string', 'max:80'],
            'birthCertificateNo' => ['nullable', 'string', 'max:80'],
            'patientCategoryId' => ['nullable', 'integer'],
            'patientSubCategoryId' => ['nullable', 'integer'],
            'schemeId' => ['nullable', 'integer'],
            'patientCategory' => ['nullable', 'string', 'max:180'],
            'patientSubCategory' => ['nullable', 'string', 'max:180'],
            'branchId' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', Rule::in(config('patients.statuses', []))],
            'address' => ['nullable', 'string', 'max:255'],
            'emergencyContact' => ['nullable', 'string', 'max:180'],
            'emergencyPhone' => ['nullable', 'string', 'max:50'],
            'kinRelationship' => ['nullable', 'string', 'max:60'],
            'bloodGroup' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string'],
            'insuranceProvider' => ['nullable', 'string', 'max:180'],
            'insuranceScheme' => ['nullable', 'string', 'max:180'],
            'insurancePolicyNo' => ['nullable', 'string', 'max:120'],
            'insuranceNumber' => ['nullable', 'string', 'max:120'],
            'registeredDate' => ['nullable', 'date'],
        ];
    }
}
