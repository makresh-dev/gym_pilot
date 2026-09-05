<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFollowUpTaskRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'member_id' => [
                'required',
                'string',
                'exists:members,id',
            ],

            'intervention_id' => [
                'nullable',
                'string',
                'exists:interventions,id',
            ],

            'due_date' => [
                'required',
                'date',
            ],

            /*
             * Deliberately nullable.
             *
             * The Solo Gym MVP does not expose staff assignment.
             * This field exists only for future subscription tiers.
             */
            'assigned_to_user_id' => [
                'nullable',
                'string',
                'exists:users,id',
            ],
        ];
    }
}