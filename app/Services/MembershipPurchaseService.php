<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MembershipPurchaseService
{
    public function __construct(
        private MembershipService $membershipService,
        private PaymentService $paymentService,
    ) {
    }

    public function create(
        Member $member,
        MembershipPlan $plan,
        Carbon $startDate,
        bool $recordPayment = false,
        ?float $paymentAmount = null,
        ?PaymentMethod $paymentMethod = null,
        ?Carbon $paidAt = null,
    ): Membership {
        return DB::transaction(function () use (
            $member,
            $plan,
            $startDate,
            $recordPayment,
            $paymentAmount,
            $paymentMethod,
            $paidAt,
        ) {
            $membership = $this->membershipService->create(
                member: $member,
                plan: $plan,
                startDate: $startDate,
            );

            if ($recordPayment) {
                if ($paymentAmount === null) {
                    throw new \InvalidArgumentException(
                        'Payment amount is required when recording payment.'
                    );
                }

                if ($paymentMethod === null) {
                    throw new \InvalidArgumentException(
                        'Payment method is required when recording payment.'
                    );
                }

                $this->paymentService->create(
                    membership: $membership,
                    amount: $paymentAmount,
                    paymentMethod: $paymentMethod,
                    paidAt: $paidAt ?? now(),
                );
            }

            return $membership;
        });
    }
}