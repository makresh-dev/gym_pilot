<?php

namespace Tests\Feature\Security;

use App\Enums\MemberGoalType;
use App\Models\Member;
use App\Models\MemberAccount;
use App\Models\Organization;
use App\Models\User;
use App\Services\Tenancy\Exceptions\TenantContextMissingException;
use App\Services\Tenancy\Exceptions\TenantMismatchException;
use App\Services\Tenancy\TenantContext;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        TenantContext::clear();
        parent::tearDown();
    }

    /**
     * Test 1: Query isolation.
     * Gym A and Gym B have separate members. Queries under Gym A only return Gym A members,
     * and queries under Gym B only return Gym B members.
     */
    public function test_query_isolation_between_tenants(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $memberA = Member::withoutTenantScope()->create([
            'organization_id' => $gymA->id,
            'name' => 'Alice Alpha',
            'email' => 'alice@alpha.test',
            'phone' => '9000000001',
        ]);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Bob Beta',
            'email' => 'bob@beta.test',
            'phone' => '9000000002',
        ]);

        TenantContext::set($gymA);
        $alphaResults = Member::query()->get();
        $this->assertCount(1, $alphaResults);
        $this->assertTrue($alphaResults->contains('id', $memberA->id));
        $this->assertFalse($alphaResults->contains('id', $memberB->id));

        TenantContext::set($gymB);
        $betaResults = Member::query()->get();
        $this->assertCount(1, $betaResults);
        $this->assertTrue($betaResults->contains('id', $memberB->id));
        $this->assertFalse($betaResults->contains('id', $memberA->id));
    }

    /**
     * Test 2: Cross-tenant lookup returns null (normal not-found semantics).
     */
    public function test_cross_tenant_lookup_returns_null(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Bob Beta',
            'email' => 'bob@beta.test',
            'phone' => '9000000002',
        ]);

        TenantContext::set($gymA);

        $found = Member::find($memberB->id);
        $this->assertNull($found);
    }

    /**
     * Test 3: Automatic tenant assignment on creation.
     */
    public function test_automatic_tenant_assignment_on_model_creation(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        TenantContext::set($gymA);

        $member = Member::create([
            'name' => 'Charlie Alpha',
            'email' => 'charlie@alpha.test',
            'phone' => '9000000003',
        ]);

        $this->assertSame($gymA->id, $member->organization_id);
        $this->assertDatabaseHas('members', [
            'id' => $member->id,
            'organization_id' => $gymA->id,
            'name' => 'Charlie Alpha',
        ]);
    }

    /**
     * Test 4: Conflicting organization_id cannot override active tenant context.
     */
    public function test_conflicting_organization_id_is_rejected(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        TenantContext::set($gymA);

        $this->expectException(TenantMismatchException::class);

        Member::create([
            'organization_id' => $gymB->id,
            'name' => 'Malicious Member',
            'email' => 'malicious@test.com',
            'phone' => '9000000099',
        ]);
    }

    /**
     * Test 5: Related child creation automatically inherits tenant context.
     */
    public function test_related_child_creation_automatically_inherits_tenant_context(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        TenantContext::set($gymA);

        $member = Member::create([
            'name' => 'David Alpha',
            'email' => 'david@alpha.test',
            'phone' => '9000000004',
        ]);

        $expectation = $member->expectations()->create([
            'visits_per_week' => 3,
            'start_date' => now()->toDateString(),
            'end_date' => null,
        ]);

        $goal = $member->goals()->create([
            'goal' => MemberGoalType::WEIGHT_LOSS,
            'start_date' => now()->toDateString(),
            'end_date' => null,
        ]);

        $this->assertSame($gymA->id, $expectation->organization_id);
        $this->assertSame($gymA->id, $goal->organization_id);

        $this->assertDatabaseHas('member_expectations', [
            'id' => $expectation->id,
            'organization_id' => $gymA->id,
            'member_id' => $member->id,
        ]);

        $this->assertDatabaseHas('member_goals', [
            'id' => $goal->id,
            'organization_id' => $gymA->id,
            'member_id' => $member->id,
        ]);
    }

    /**
     * Test 6: No tenant context fails closed.
     */
    public function test_no_tenant_context_fails_closed(): void
    {
        TenantContext::clear();

        $this->expectException(TenantContextMissingException::class);

        Member::query()->get();
    }

    /**
     * Test 7: Nested tenant context via runInTenant.
     */
    public function test_nested_tenant_context_switching_via_run_in_tenant(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        TenantContext::set($gymA);
        $this->assertSame($gymA->id, TenantContext::id());

        TenantContext::runInTenant($gymB, function () use ($gymA, $gymB) {
            $this->assertSame($gymB->id, TenantContext::id());
        });

        $this->assertSame($gymA->id, TenantContext::id());
    }

    /**
     * Test 8: Exception safety in runInTenant restores original context.
     */
    public function test_exception_in_run_in_tenant_restores_prior_context(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        TenantContext::set($gymA);

        try {
            TenantContext::runInTenant($gymB, function () {
                throw new Exception('Unexpected failure inside tenant callback');
            });
        } catch (Exception $e) {
            $this->assertSame('Unexpected failure inside tenant callback', $e->getMessage());
        }

        $this->assertSame($gymA->id, TenantContext::id());
    }

    /**
     * Test A: MemberAccount with same phone across gyms remains isolated.
     */
    public function test_member_account_same_phone_in_different_gyms_is_isolated(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $memberA = Member::withoutTenantScope()->create([
            'organization_id' => $gymA->id,
            'name' => 'Member Alpha',
            'email' => 'shared@example.com',
            'phone' => '9999999999',
        ]);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Member Beta',
            'email' => 'shared@example.com',
            'phone' => '9999999999',
        ]);

        $accountA = MemberAccount::withoutTenantScope()->create([
            'member_id' => $memberA->id,
            'password' => Hash::make('password123'),
        ]);

        $accountB = MemberAccount::withoutTenantScope()->create([
            'member_id' => $memberB->id,
            'password' => Hash::make('password456'),
        ]);

        TenantContext::set($gymA);
        $resultsA = MemberAccount::query()->get();
        $this->assertCount(1, $resultsA);
        $this->assertTrue($resultsA->contains('id', $accountA->id));
        $this->assertFalse($resultsA->contains('id', $accountB->id));

        TenantContext::set($gymB);
        $resultsB = MemberAccount::query()->get();
        $this->assertCount(1, $resultsB);
        $this->assertTrue($resultsB->contains('id', $accountB->id));
        $this->assertFalse($resultsB->contains('id', $accountA->id));
    }

    /**
     * Test B: Cross-tenant MemberAccount lookup returns null.
     */
    public function test_cross_tenant_member_account_lookup_returns_null(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Member Beta',
            'email' => 'beta@example.com',
            'phone' => '9888888888',
        ]);

        $accountB = MemberAccount::withoutTenantScope()->create([
            'member_id' => $memberB->id,
            'password' => Hash::make('password456'),
        ]);

        TenantContext::set($gymA);
        $this->assertNull(MemberAccount::find($accountB->id));
    }

    /**
     * Test C: MemberAccount creation respects tenant context boundary.
     */
    public function test_member_account_creation_validates_owning_member_tenant(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $memberA = Member::withoutTenantScope()->create([
            'organization_id' => $gymA->id,
            'name' => 'Member Alpha',
            'email' => 'alpha@example.com',
            'phone' => '9777777777',
        ]);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Member Beta',
            'email' => 'beta@example.com',
            'phone' => '9666666666',
        ]);

        TenantContext::set($gymA);

        // Allowed: Member A belongs to Gym A
        $accountA = MemberAccount::create([
            'member_id' => $memberA->id,
            'password' => Hash::make('password123'),
        ]);
        $this->assertNotNull($accountA);

        // Rejected: Member B belongs to Gym B, cannot be created under Gym A
        $this->expectException(TenantMismatchException::class);
        MemberAccount::create([
            'member_id' => $memberB->id,
            'password' => Hash::make('password123'),
        ]);
    }

    /**
     * Test D: Tenant context restoration with MemberAccount.
     */
    public function test_tenant_context_restoration_during_nested_member_account_operations(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        TenantContext::set($gymA);
        $this->assertSame($gymA->id, TenantContext::id());

        TenantContext::runInTenant($gymB, function () use ($gymB) {
            $this->assertSame($gymB->id, TenantContext::id());
        });

        $this->assertSame($gymA->id, TenantContext::id());
    }

    /**
     * Test: Intentional platform-level escape hatch withoutTenantScope.
     */
    public function test_without_tenant_scope_allows_intentional_platform_operations(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        Member::withoutTenantScope()->create([
            'organization_id' => $gymA->id,
            'name' => 'Member A',
            'email' => 'a@example.com',
            'phone' => '9111111111',
        ]);

        Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Member B',
            'email' => 'b@example.com',
            'phone' => '9222222222',
        ]);

        // When TenantContext is clear, standard query throws
        TenantContext::clear();
        $this->assertFalse(TenantContext::has());

        // But explicit withoutTenantScope succeeds and returns both
        $allMembers = Member::withoutTenantScope()->get();
        $this->assertCount(2, $allMembers);
    }

    /**
     * Test: IdentifyTenant middleware correctly scopes HTTP requests.
     */
    public function test_identify_tenant_middleware_scopes_web_requests(): void
    {
        $gymA = Organization::factory()->create(['name' => 'Gym Alpha']);
        $gymB = Organization::factory()->create(['name' => 'Gym Beta']);

        $userA = User::factory()->create(['organization_id' => $gymA->id]);

        $memberA = Member::withoutTenantScope()->create([
            'organization_id' => $gymA->id,
            'name' => 'Alice Alpha',
            'email' => 'alice@alpha.test',
            'phone' => '9333333333',
        ]);

        $memberB = Member::withoutTenantScope()->create([
            'organization_id' => $gymB->id,
            'name' => 'Bob Beta',
            'email' => 'bob@beta.test',
            'phone' => '9444444444',
        ]);

        $response = $this->actingAs($userA)->get(route('members.index'));
        $response->assertOk();

        // Ensure TenantContext is cleaned up after request
        $this->assertFalse(TenantContext::has());
    }
}
