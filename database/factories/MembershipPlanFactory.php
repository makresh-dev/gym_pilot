<?php

namespace Database\Factories;

use App\Models\MembershipPlan;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MembershipPlan>
 */
class MembershipPlanFactory extends Factory
{
    protected $model = MembershipPlan::class;

    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->words(2, true) . ' Plan',
            'price' => fake()->randomFloat(2, 500, 5000),
            'duration_days' => fake()->randomElement([30, 90, 180, 365]),
            'is_active' => true,
        ];
    }
}
