<?php

namespace Tests\Feature;

use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentCollectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_creation_page_includes_organization_receiving_details()
    {
        $organization = Organization::factory()->create([
            'upi_id' => 'fitgym@okhdfcbank',
            'bank_account_name' => 'Fit Gym Private Limited',
            'bank_name' => 'HDFC Bank',
            'bank_account_number' => '50100999999999',
            'bank_ifsc_code' => 'HDFC0001234',
        ]);

        $user = User::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $plan = MembershipPlan::create([
            'organization_id' => $organization->id,
            'name' => 'Gold Annual',
            'duration_days' => 365,
            'price' => 12000,
        ]);

        $member = Member::create([
            'organization_id' => $organization->id,
            'name' => 'Rahul Sharma',
            'email' => 'rahul@example.com',
            'phone' => '9876543210',
        ]);

        $membership = Membership::create([
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'price' => 12000,
            'status' => 'active',
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('members.memberships.payments.create', [
                'member' => $member->id,
                'membership' => $membership->id,
            ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Payments/Create')
            ->has('organization')
            ->where('organization.upi_id', 'fitgym@okhdfcbank')
            ->where('organization.bank_name', 'HDFC Bank')
            ->where('organization.bank_account_number', '50100999999999')
            ->where('organization.bank_ifsc_code', 'HDFC0001234')
        );
    }
}
