<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMembershipRenewalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'membership_plan_id' => [
                'required',
                'string',
                'exists:membership_plans,id',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'payment' => [
                'nullable',
                'boolean',
            ],

            'payment_amount' => [
                'nullable',
                'numeric',
                'min:0.01',
                'required_if:payment,true',
            ],

            'payment_method' => [
                'nullable',
                'string',
                'required_if:payment,true',
            ],

            'paid_at' => [
                'nullable',
                'date',
                'required_if:payment,true',
            ],
        ];
    }
}