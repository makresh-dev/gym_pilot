<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Enums\SignalType;
use App\Models\Signal;
use Carbon\Carbon;

class MembershipExpiryResolver
{
    public function resolve(Signal $signal): bool
    {
        if (
            $signal->type !== SignalType::MEMBERSHIP_EXPIRING ||
            $signal->status !== SignalStatus::OPEN
        ) {
            return false;
        }

        $today = Carbon::today();

        $hasMembershipOutsideExpiryWindow = $signal->member
            ->memberships()
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>', $today->copy()->addDays(7))
            ->exists();

        if (! $hasMembershipOutsideExpiryWindow) {
            return false;
        }

        $signal->update([
            'status' => SignalStatus::RESOLVED->value,
            'resolved_at' => now(),
        ]);

        return true;
    }
}