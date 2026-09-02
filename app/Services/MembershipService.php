<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MembershipService
{
    public function create(
        Member $member,
        MembershipPlan $plan,
        Carbon $startDate,
    ): Membership {
        if ($member->organization_id !== $plan->organization_id) {
            throw new InvalidArgumentException(
                'The membership plan does not belong to the member\'s organization.'
            );
        }

        return DB::transaction(function () use (
            $member,
            $plan,
            $startDate
        ) {
            $endDate = $startDate
                ->copy()
                ->addDays($plan->duration_days - 1);

            return Membership::create([
                'organization_id' => $member->organization_id,
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'price' => $plan->price,
                'status' => 'active',
            ]);
        });
    }
}