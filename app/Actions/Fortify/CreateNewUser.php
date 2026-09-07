<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;


class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),

            'gym_name' => [
                'required',
                'string',
                'max:255',
            ],

            'upi_id' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/',
            ],

            'bank_account_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'bank_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'bank_account_number' => [
                'nullable',
                'string',
                'max:50',
            ],

            'bank_ifsc_code' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/i',
            ],

            'password' => $this->passwordRules(),
        ], [
            'upi_id.regex' => 'Please enter a valid UPI ID (e.g. username@upi or 9876543210@paytm).',
            'bank_ifsc_code.regex' => 'Please enter a valid 11-character IFSC code (e.g. SBIN0001234).',
        ])->validate();

        return DB::transaction(function () use ($input): User {
            $baseSlug = Str::slug($input['gym_name']);

            $slug = $baseSlug;
            $counter = 1;

            while (Organization::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            $organization = Organization::create([
                'name' => $input['gym_name'],
                'slug' => $slug,
                'upi_id' => !empty($input['upi_id']) ? trim($input['upi_id']) : null,
                'bank_account_name' => !empty($input['bank_account_name']) ? trim($input['bank_account_name']) : null,
                'bank_name' => !empty($input['bank_name']) ? trim($input['bank_name']) : null,
                'bank_account_number' => !empty($input['bank_account_number']) ? trim($input['bank_account_number']) : null,
                'bank_ifsc_code' => !empty($input['bank_ifsc_code']) ? strtoupper(trim($input['bank_ifsc_code'])) : null,
            ]);

            return User::create([
                'organization_id' => $organization->id,
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => 'owner',
            ]);
        });
    }
}