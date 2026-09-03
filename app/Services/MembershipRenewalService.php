<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MembershipRenewalService
{
    public function __construct(
        private PaymentService $paymentService,
    ) {
    }

    public function renew(
        Member $member,
        Membership $membership,
        MembershipPlan $plan,
        ?Carbon $startDate = null,
        bool $recordPayment = false,
        ?float $paymentAmount = null,
        ?PaymentMethod $paymentMethod = null,
        ?Carbon $paidAt = null,
    ): Membership {
        if ($membership->member_id !== $member->id) {
            throw new RuntimeException(
                'Membership does not belong to this member.'
            );
        }

        if ($membership->organization_id !== $member->organization_id) {
            throw new RuntimeException(
                'Membership does not belong to this organization.'
            );
        }

        if ($plan->organization_id !== $member->organization_id) {
            throw new RuntimeException(
                'Membership plan does not belong to this organization.'
            );
        }

        if (! $plan->is_active) {
            throw new RuntimeException(
                'Membership plan is inactive.'
            );
        }

        $startDate ??= Carbon::today();

        $startDate = $startDate->copy()->startOfDay();

        $endDate = $startDate
            ->copy()
            ->addDays($plan->duration_days - 1)
            ->endOfDay();

        /*
         * Prevent overlapping memberships.
         *
         * Two date ranges overlap when:
         *
         * existing.start <= new.end
         * AND
         * existing.end >= new.start
         *
         * Exclude the membership currently being renewed.
         */
        $overlappingMembership = $member->memberships()
            ->whereKeyNot($membership->id)
            ->whereDate('start_date', '<=', $endDate->toDateString())
            ->whereDate('end_date', '>=', $startDate->toDateString())
            ->exists();

        if ($overlappingMembership) {
            throw new RuntimeException(
                'The renewal dates overlap with another membership.'
            );
        }

        if ($recordPayment) {
            if ($paymentAmount === null || $paymentAmount <= 0) {
                throw new RuntimeException(
                    'A valid payment amount is required.'
                );
            }

            if ($paymentMethod === null) {
                throw new RuntimeException(
                    'A payment method is required.'
                );
            }
        }

        return DB::transaction(function () use (
            $member,
            $plan,
            $startDate,
            $recordPayment,
            $paymentAmount,
            $paymentMethod,
            $paidAt,
        ) {
            $newMembership = $member->memberships()->create([
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

            /*
             * Use PaymentService so all payment validation
             * remains centralized.
             */
            if ($recordPayment) {
                $this->paymentService->create(
                    $newMembership,
                    $paymentAmount,
                    $paymentMethod,
                    $paidAt ?? now(),
                );
            }

            return $newMembership;
        });
    }
}