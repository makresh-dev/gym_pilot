<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Enums\SignalType;
use App\Models\Signal;
use Carbon\Carbon;

class MembershipExpiryResolver
{
    private const EXPIRY_WINDOW_DAYS = 7;

    public function resolve(Signal $signal): bool
    {
        if (
            $signal->type !== SignalType::MEMBERSHIP_EXPIRING ||
            $signal->status !== SignalStatus::OPEN
        ) {
            return false;
        }

        $today = Carbon::today();

        /*
         * Resolve the signal when the member now has a current
         * membership that extends beyond the expiry window.
         *
         * Example:
         *
         * Existing membership ends: September 10
         * Signal detected: September 4
         *
         * Member renews through September 30.
         * The expiry signal is now resolved.
         */
        $hasMembershipOutsideExpiryWindow = $signal->member
            ->memberships()
            ->currentlyActive()
            ->whereDate(
                'end_date',
                '>',
                $today->copy()->addDays(
                    self::EXPIRY_WINDOW_DAYS
                )
            )
            ->exists();

        if ($hasMembershipOutsideExpiryWindow) {
            $signal->update([
                'status' => SignalStatus::RESOLVED->value,
                'resolved_at' => now(),
            ]);

            return true;
        }

        /*
         * If the membership that triggered the signal has now expired
         * and there is no replacement membership, the signal is no
         * longer actionable.
         *
         * We resolve it because the expiry event has completed rather
         * than leaving an obsolete OPEN signal indefinitely.
         */
        $triggeredMembershipEndDate = data_get(
            $signal->evidence,
            'membership_end_date'
        );

        if (
            $triggeredMembershipEndDate !== null &&
            Carbon::parse($triggeredMembershipEndDate)->lt($today)
        ) {
            $signal->update([
                'status' => SignalStatus::RESOLVED->value,
                'resolved_at' => now(),
            ]);

            return true;
        }

        return false;
    }
}