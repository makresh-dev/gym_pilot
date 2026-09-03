<?php

namespace App\Services\Intelligence;

use App\Enums\SignalSeverity;
use App\Enums\SignalType;
use App\Models\Member;
use Carbon\Carbon;

class MembershipExpiryDetector
{
    private const EXPIRY_WINDOW_DAYS = 7;

    public function detect(Member $member): ?array
    {
        $today = Carbon::today();

        $membership = $member->memberships()
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate(
                'end_date',
                '>=',
                $today
            )
            ->whereDate(
                'end_date',
                '<=',
                $today->copy()->addDays(self::EXPIRY_WINDOW_DAYS)
            )
            ->orderBy('end_date')
            ->first();

        if (! $membership) {
            return null;
        }

        $daysRemaining = $today->diffInDays(
            $membership->end_date,
            false
        );

        $severity = $daysRemaining <= 3
            ? SignalSeverity::HIGH->value
            : SignalSeverity::MEDIUM->value;

        return [
            'type' => SignalType::MEMBERSHIP_EXPIRING->value,
            'severity' => $severity,
            'evidence' => [
                'days_remaining' => $daysRemaining,
                'membership_end_date' => $membership->end_date->toDateString(),
                'plan' => $membership->membershipPlan?->name,
                'price' => $membership->price,
            ],
        ];
    }
}