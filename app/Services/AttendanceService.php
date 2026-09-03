<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AttendanceService
{
    public function checkIn(Member $member): Attendance
    {
        return DB::transaction(function () use ($member) {
            $alreadyCheckedIn = $member->attendances()
                ->whereDate('check_in_at', Carbon::today())
                ->exists();

            if ($alreadyCheckedIn) {
                throw new RuntimeException(
                    'Member has already checked in today.'
                );
            }

            $hasValidMembership = $member->memberships()
                ->get()
                ->contains(
                    fn ($membership) => $membership->isActive()
                );

            if (! $hasValidMembership) {
                throw new RuntimeException(
                    'Member does not have an active membership today.'
                );
            }

            return $member->attendances()->create([
                'organization_id' => $member->organization_id,
                'check_in_at' => now(),
                'source' => 'manual',
            ]);
        });
    }
}