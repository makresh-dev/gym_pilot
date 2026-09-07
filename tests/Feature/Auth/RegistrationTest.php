<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->skipUnlessFortifyHas(Features::registration());
    }

    public function test_registration_screen_can_be_rendered()
    {
        $response = $this->get(route('register'));

        $response->assertOk();
    }

    public function test_new_users_can_register()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'gym_name' => 'Iron Haven Gym',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_new_owner_can_register_with_upi_and_bank_details()
    {
        $response = $this->post(route('register.store'), [
            'name' => 'John Gym Owner',
            'gym_name' => 'Titan Fitness',
            'email' => 'titan@fitness.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'upi_id' => 'titanfitness@okaxis',
            'bank_account_name' => 'Titan Fitness LLP',
            'bank_name' => 'HDFC Bank',
            'bank_account_number' => '50100234567890',
            'bank_ifsc_code' => 'HDFC0001234',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseHas('organizations', [
            'name' => 'Titan Fitness',
            'upi_id' => 'titanfitness@okaxis',
            'bank_account_name' => 'Titan Fitness LLP',
            'bank_name' => 'HDFC Bank',
            'bank_account_number' => '50100234567890',
            'bank_ifsc_code' => 'HDFC0001234',
        ]);
    }
}
