<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Models\Membership;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentService
{
    public function create(
        Membership $membership,
        float $amount,
        PaymentMethod $paymentMethod,
        Carbon $paidAt,
    ): Payment {
        if ($amount <= 0) {
            throw new InvalidArgumentException(
                'Payment amount must be greater than zero.'
            );
        }

        if (! $membership->exists) {
            throw new InvalidArgumentException(
                'Membership does not exist.'
            );
        }

        if (! $membership->member_id) {
            throw new InvalidArgumentException(
                'Membership must belong to a member.'
            );
        }

        if (! $membership->organization_id) {
            throw new InvalidArgumentException(
                'Membership must belong to an organization.'
            );
        }

        $balanceDue = $membership->balanceDue();

        if ($balanceDue <= 0) {
            throw new InvalidArgumentException(
                'Membership has no outstanding balance.'
            );
        }

        if ($amount > $balanceDue) {
            throw new InvalidArgumentException(
                'Payment amount cannot exceed the outstanding balance.'
            );
        }

        return DB::transaction(function () use (
            $membership,
            $amount,
            $paymentMethod,
            $paidAt,
        ) {
            return Payment::create([
                'organization_id' => $membership->organization_id,
                'member_id' => $membership->member_id,
                'membership_id' => $membership->id,
                'amount' => $amount,
                'payment_method' => $paymentMethod->value,
                'paid_at' => $paidAt,
            ]);
        });
    }
}