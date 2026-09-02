<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Models\Member;
use App\Models\Signal;
use Carbon\Carbon;

class AttendanceDeclineResolver
{
    private const RECOVERY_WEEKS = 2;

    private const RECOVERY_THRESHOLD = 0.5;

    public function resolve(Signal $signal): bool
    {
        if ($signal->status !== SignalStatus::OPEN) {
            return false;
        }

        if ($signal->type !== 'attendance_decline') {
            return false;
        }

        $member = $signal->member;

        $baselineAverage = $signal->evidence['baseline_average'] ?? null;

        if ($baselineAverage === null || $baselineAverage <= 0) {
            return false;
        }

        $today = Carbon::today()->startOfWeek();

        $recentStart = $today
            ->copy()
            ->subWeeks(self::RECOVERY_WEEKS);

        $attendances = $member->attendances()
            ->where('check_in_at', '>=', $recentStart)
            ->where('check_in_at', '<', $today)
            ->get();

        $weeklyCounts = $attendances
            ->groupBy(function ($attendance) {
                return $attendance->check_in_at
                    ->copy()
                    ->startOfWeek()
                    ->toDateString();
            })
            ->map(fn ($week) => $week->count());

        $recentVisits = collect();

        for ($i = 0; $i < self::RECOVERY_WEEKS; $i++) {
            $weekStart = $recentStart
                ->copy()
                ->addWeeks($i);

            $weekKey = $weekStart->toDateString();

            $recentVisits->push(
                $weeklyCounts->get($weekKey, 0)
            );
        }

        $healthyWeeks = $recentVisits->filter(
            fn ($visits) =>
                $visits >= ($baselineAverage * self::RECOVERY_THRESHOLD)
        );

        if ($healthyWeeks->count() < self::RECOVERY_WEEKS) {
            return false;
        }

        $signal->update([
            'status' => SignalStatus::RESOLVED->value,
            'resolved_at' => now(),
        ]);

        return true;
    }
}