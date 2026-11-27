<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VisitStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appointmentId' => ['nullable', 'string', 'max:50', 'required_if:source,Appointment'],
            'departmentId' => ['nullable', 'integer', 'required_without:consultationServiceId'],
            'consultationServiceId' => ['nullable', 'integer'],
            'practitionerId' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', Rule::in(['Registration', 'Appointment'])],
            'encounterType' => ['nullable', 'string', 'max:40'],
            'visitType' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
            'newVisit' => ['nullable', 'boolean'],
            'branchId' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
