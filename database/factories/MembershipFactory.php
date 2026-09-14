<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Membership>
 */
class MembershipFactory extends Factory
{
    protected $model = Membership::class;

    public function definition(): array
    {
        $organization = Organization::factory();

        return [
            'organization_id' => $organization,
            'member_id' => Member::factory()->for($organization),
            'membership_plan_id' => MembershipPlan::factory()->for($organization),
            'start_date' => today()->subDays(10),
            'end_date' => today()->addDays(20),
            'price' => 1500.00,
            'status' => 'active',
        ];
    }
}
