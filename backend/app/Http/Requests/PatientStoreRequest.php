<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $requireIdentifier = (bool) config('patients.require_identifier', false);

        return [
            'name' => ['required', 'string', 'max:180'],
            'dob' => ['nullable', 'date', 'before_or_equal:today', 'required_without:age'],
            'age' => ['nullable', 'integer', 'min:0', 'max:130', 'required_without:dob'],
            'gender' => ['required', Rule::in(['Male', 'Female', 'Other'])],
            'phone' => ['required', 'string', 'max:50', 'regex:/^[0-9+()\s-]{7,30}$/'],
            'email' => ['nullable', 'email', 'max:180'],
            'nationalId' => [Rule::requiredIf($requireIdentifier && empty($this->input('birthCertificateNo'))), 'nullable', 'string', 'max:80'],
            'birthCertificateNo' => [Rule::requiredIf($requireIdentifier && empty($this->input('nationalId'))), 'nullable', 'string', 'max:80'],
            'patientCategoryId' => ['nullable', 'integer', 'required_without:patientCategory'],
            'patientCategory' => ['nullable', 'string', 'max:180', 'required_without:patientCategoryId'],
            'patientSubCategoryId' => ['nullable', 'integer'],
            'patientSubCategory' => ['nullable', 'string', 'max:180'],
            'schemeId' => ['nullable', 'integer'],
            'branchId' => ['required', 'integer', 'min:1'],
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
            'registrationSource' => ['nullable', 'string', 'max:40'],
            'duplicateOverrideToken' => ['nullable', 'string', 'max:120'],
            'duplicateOverrideReason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Enter the patient full name.',
            'dob.required_without' => 'Enter the date of birth or the age.',
            'age.required_without' => 'Enter the date of birth or the age.',
            'gender.required' => 'Select the patient gender.',
            'phone.required' => 'Enter the patient phone number.',
            'patientCategoryId.required_without' => 'Select the patient category or type.',
            'patientCategory.required_without' => 'Select the patient category or type.',
            'branchId.required' => 'Select the registering branch.',
        ];
    }
}
