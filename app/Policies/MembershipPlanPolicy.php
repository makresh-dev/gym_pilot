<?php

namespace App\Policies;

use App\Models\MembershipPlan;
use App\Models\User;

class MembershipPlanPolicy
{
    public function view(User $user, MembershipPlan $membershipPlan): bool
    {
        return $user->organization_id === $membershipPlan->organization_id;
    }

    public function update(User $user, MembershipPlan $membershipPlan): bool
    {
        return $user->organization_id === $membershipPlan->organization_id;
    }

    public function delete(User $user, MembershipPlan $membershipPlan): bool
    {
        return $user->organization_id === $membershipPlan->organization_id;
    }
}