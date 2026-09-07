<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        $name = fake()->company() . ' Gym';

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::random(5),
            'upi_id' => fake()->userName() . '@upi',
            'bank_account_name' => fake()->name(),
            'bank_name' => 'HDFC Bank',
            'bank_account_number' => fake()->numerify('50100#########'),
            'bank_ifsc_code' => 'HDFC0001234',
        ];
    }
}
