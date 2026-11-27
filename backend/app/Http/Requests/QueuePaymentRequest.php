<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QueuePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paymentMethod' => ['required', Rule::in(['Cash', 'M-Pesa', 'Card', 'Bank Transfer'])],
            'reference' => ['nullable', 'string', 'max:150', Rule::requiredIf($this->input('paymentMethod') === 'M-Pesa')],
        ];
    }
}
