<?php

namespace App\Http\Requests;

use App\Enums\InterventionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInterventionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                Rule::enum(InterventionType::class),
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'outcome' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }
}