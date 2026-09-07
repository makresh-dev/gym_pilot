<?php

namespace Tests\Feature\Settings;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_payment_settings()
    {
        $response = $this->get(route('payment-settings.edit'));

        $response->assertRedirect(route('login'));
    }

    public function test_payment_settings_page_is_displayed_for_authenticated_owner()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get(route('payment-settings.edit'));

        $response->assertOk();
    }

    public function test_payment_settings_can_be_updated()
    {
        $organization = Organization::factory()->create([
            'upi_id' => 'oldgym@upi',
        ]);

        $user = User::factory()->create([
            'organization_id' => $organization->id,
        ]);

        $response = $this
            ->actingAs($user)
            ->patch(route('payment-settings.update'), [
                'upi_id' => 'newgym@okhdfcbank',
                'bank_account_name' => 'New Gym Fitness Private Limited',
                'bank_name' => 'ICICI Bank',
                'bank_account_number' => '123456789012',
                'bank_ifsc_code' => 'ICIC0001234',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('payment-settings.edit'));

        $organization->refresh();

        $this->assertSame('newgym@okhdfcbank', $organization->upi_id);
        $this->assertSame('New Gym Fitness Private Limited', $organization->bank_account_name);
        $this->assertSame('ICICI Bank', $organization->bank_name);
        $this->assertSame('123456789012', $organization->bank_account_number);
        $this->assertSame('ICIC0001234', $organization->bank_ifsc_code);
    }

    public function test_invalid_upi_id_is_rejected()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('payment-settings.update'), [
                'upi_id' => 'invalid-upi-without-at',
            ]);

        $response->assertSessionHasErrors('upi_id');
    }

    public function test_invalid_ifsc_code_is_rejected()
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch(route('payment-settings.update'), [
                'bank_ifsc_code' => '123456',
            ]);

        $response->assertSessionHasErrors('bank_ifsc_code');
    }
}
