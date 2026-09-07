<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_provides_payment_receiving_details_and_amounts_summary()
    {
        $organization = \App\Models\Organization::factory()->create([
            'name' => 'Spartan Gym',
            'upi_id' => 'spartan@upi',
            'bank_account_name' => 'Spartan Gym LLC',
            'bank_name' => 'Axis Bank',
            'bank_account_number' => '987654321012',
            'bank_ifsc_code' => 'UTIB0001234',
        ]);

        $user = User::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $member = \App\Models\Member::create([
            'organization_id' => $organization->id,
            'name' => 'Vikas Roy',
            'email' => 'vikas@example.com',
            'phone' => '9876543210',
        ]);

        $plan = \App\Models\MembershipPlan::create([
            'organization_id' => $organization->id,
            'name' => 'Monthly Pro',
            'duration_days' => 30,
            'price' => 2500,
        ]);

        $membership = \App\Models\Membership::create([
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'price' => 2500,
            'status' => 'active',
        ]);

        \App\Models\Payment::create([
            'organization_id' => $organization->id,
            'member_id' => $member->id,
            'membership_id' => $membership->id,
            'amount' => 2500,
            'payment_method' => \App\Enums\PaymentMethod::UPI,
            'paid_at' => now(),
        ]);

        $response = $this
            ->actingAs($user)
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('paymentReceiving')
            ->where('paymentReceiving.upi_id', 'spartan@upi')
            ->where('paymentReceiving.bank_name', 'Axis Bank')
            ->where('paymentReceiving.summary.total_received', 2500)
            ->where('paymentReceiving.summary.today_received', 2500)
            ->has('paymentReceiving.summary.recent_payments', 1)
        );
    }
}
