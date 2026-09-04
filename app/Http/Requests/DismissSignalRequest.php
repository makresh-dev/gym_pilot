<?php

namespace App\Http\Requests;

use App\Enums\SignalDismissalReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DismissSignalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => [
                'required',
                Rule::enum(SignalDismissalReason::class),
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}