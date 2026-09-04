<?php

namespace App\Http\Requests;

use App\Enums\InterventionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'signal_id' => [
                'required',
                'string',
            ],

            'type' => [
                'required',
                Rule::enum(InterventionType::class),
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'outcome' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'intervened_at' => [
                'nullable',
                'date',
            ],
        ];
    }
}