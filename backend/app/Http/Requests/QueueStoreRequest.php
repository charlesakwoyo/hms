<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QueueStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patientId' => ['required', 'string', 'max:50'],
            'visitId' => ['required', 'string', 'max:50'],
            'consultationServiceId' => ['required', 'integer'],
            'consultationServiceCode' => ['nullable', 'string', 'max:80'],
            'consultationType' => ['nullable', 'string', 'max:180'],
            'consultationServiceName' => ['nullable', 'string', 'max:180'],
            'consultationFee' => ['nullable', 'numeric', 'min:0'],
            'consultationFeePaid' => ['nullable', 'boolean'],
            'paymentMethod' => ['nullable', 'string', 'max:80'],
            'patientSubCategory' => ['nullable', 'string', 'max:100'],
            'schemeId' => ['nullable', 'integer'],
            'departmentId' => ['nullable', 'integer'],
            'priority' => ['nullable', Rule::in(['Normal', 'Urgent', 'Emergency'])],
            'emergency' => ['nullable', 'boolean'],
            'servicePointNote' => ['nullable', 'string'],
            'branchId' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
