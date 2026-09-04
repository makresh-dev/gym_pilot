<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('membership_plans', 'name')
                    ->where(
                        fn ($query) => $query->where(
                            'organization_id',
                            $this->user()->organization_id
                        )
                    )
                    ->ignore($this->route('membershipPlan')),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1'],
        ];
    }
}