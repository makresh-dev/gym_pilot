<?php

namespace Database\Factories;

use App\Models\Member;
use App\Models\MemberAccount;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<MemberAccount>
 */
class MemberAccountFactory extends Factory
{
    protected $model = MemberAccount::class;

    public function definition(): array
    {
        $organization = Organization::factory();
        $member = Member::factory()->for($organization);

        return [
            'organization_id' => $organization,
            'member_id' => $member,
            'password' => Hash::make('password'),
        ];
    }
}
