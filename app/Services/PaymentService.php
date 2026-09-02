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

        $balanceDue = $membership->balanceDue();

        if ($amount > $balanceDue) {
            throw new InvalidArgumentException(
                'Payment amount cannot exceed the outstanding balance.'
            );
        }

        return DB::transaction(function () use (
            $membership,
            $amount,
            $paymentMethod,
            $paidAt
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