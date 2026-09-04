<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\MembershipPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'membership_plan_id' => [
                'required',
                'string',
                Rule::exists(MembershipPlan::class, 'id')
                    ->where(function ($query) {
                        $query
                            ->where(
                                'organization_id',
                                $this->user()->organization_id
                            )
                            ->where('is_active', true);
                    }),
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'payment' => [
                'required',
                'boolean',
            ],

            'payment_amount' => [
                'nullable',
                'numeric',
                'min:0.01',
                Rule::requiredIf(
                    fn (): bool => $this->boolean('payment')
                ),
            ],

            'payment_method' => [
                'nullable',
                Rule::enum(PaymentMethod::class),
                Rule::requiredIf(
                    fn (): bool => $this->boolean('payment')
                ),
            ],

            'paid_at' => [
                'nullable',
                'date',
                Rule::requiredIf(
                    fn (): bool => $this->boolean('payment')
                ),
            ],
        ];
    }
}