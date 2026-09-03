<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MembershipService
{
    public function create(
        Member $member,
        MembershipPlan $plan,
        Carbon $startDate,
    ): Membership {
        if ($member->organization_id !== $plan->organization_id) {
            throw new RuntimeException(
                'Membership plan does not belong to this organization.'
            );
        }

        if (! $plan->is_active) {
            throw new RuntimeException(
                'Membership plan is inactive.'
            );
        }

        $startDate = $startDate->copy()->startOfDay();

        $endDate = $startDate
            ->copy()
            ->addDays($plan->duration_days - 1)
            ->endOfDay();

        $overlappingMembership = $member->memberships()
            ->whereDate(
                'start_date',
                '<=',
                $endDate->toDateString()
            )
            ->whereDate(
                'end_date',
                '>=',
                $startDate->toDateString()
            )
            ->exists();

        if ($overlappingMembership) {
            throw new RuntimeException(
                'The membership dates overlap with an existing membership.'
            );
        }

        return DB::transaction(function () use (
            $member,
            $plan,
            $startDate,
        ) {
            return $member->memberships()->create([
                'organization_id' => $member->organization_id,
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
                'start_date' => $startDate,
                'end_date' => $startDate
                    ->copy()
                    ->addDays($plan->duration_days - 1),
                'price' => $plan->price,
                'status' => 'active',
            ]);
        });
    }
}