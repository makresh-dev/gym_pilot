<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Member;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AttendanceService
{
    public function checkIn(Member $member): Attendance
    {
        return DB::transaction(function () use ($member) {
            $member = Member::query()
                ->whereKey($member->id)
                ->where(
                    'organization_id',
                    $member->organization_id
                )
                ->lockForUpdate()
                ->firstOrFail();

            $alreadyCheckedIn = Attendance::query()
                ->where(
                    'organization_id',
                    $member->organization_id
                )
                ->where(
                    'member_id',
                    $member->id
                )
                ->whereDate('check_in_at', today())
                ->exists();

            if ($alreadyCheckedIn) {
                throw new RuntimeException(
                    'Member has already checked in today.'
                );
            }

            $hasValidMembership = $member->memberships()
                ->currentlyActive()
                ->exists();

            if (! $hasValidMembership) {
                throw new RuntimeException(
                    'Member does not have an active membership today.'
                );
            }

            return Attendance::create([
                'organization_id' => $member->organization_id,
                'member_id' => $member->id,
                'check_in_at' => now(),
                'source' => 'manual',
            ]);
        });
    }
}