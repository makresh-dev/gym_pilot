<?php

namespace App\Http\Requests;

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
                        $query->where(
                            'organization_id',
                            $this->user()->organization_id
                        );
                    }),
            ],

            'start_date' => [
                'required',
                'date',
            ],
        ];
    }
}