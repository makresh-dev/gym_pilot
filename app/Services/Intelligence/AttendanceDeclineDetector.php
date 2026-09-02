<?php

namespace App\Services\Intelligence;

use App\Enums\SignalSeverity;
use App\Enums\SignalType;
use App\Models\Member;
use Carbon\Carbon;

class AttendanceDeclineDetector
{
    private const BASELINE_WEEKS = 4;

    private const RECENT_WEEKS = 2;

    private const MIN_BASELINE_VISITS = 4;

    private const DECLINE_THRESHOLD = 50;

    private const HIGH_SEVERITY_THRESHOLD = 70;

    public function detect(Member $member): ?array
    {
        $today = Carbon::today()->startOfWeek();

        $baselineStart = $today
            ->copy()
            ->subWeeks(
                self::BASELINE_WEEKS + self::RECENT_WEEKS
            );

        /*
         * Find the member's currently active expectation.
         */
        $expectation = $member->expectations()
            ->where('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', $today);
            })
            ->latest('start_date')
            ->first();

        $expectedVisitsPerWeek = $expectation?->visits_per_week;

        /*
         * Get attendance records for the complete
         * six-week analysis window.
         */
        $attendances = $member->attendances()
            ->where('check_in_at', '>=', $baselineStart)
            ->where('check_in_at', '<', $today)
            ->get();

        /*
         * Group attendance events by calendar week.
         */
        $weeklyCounts = $attendances
            ->groupBy(function ($attendance) {
                return $attendance->check_in_at
                    ->copy()
                    ->startOfWeek()
                    ->toDateString();
            })
            ->map(fn ($week) => $week->count());

        /*
         * Build a complete six-week time series.
         *
         * A week with no attendance must explicitly
         * become zero.
         */
        $weeks = collect();

        $totalWeeks = self::BASELINE_WEEKS + self::RECENT_WEEKS;

        for ($i = 0; $i < $totalWeeks; $i++) {
            $weekStart = $baselineStart
                ->copy()
                ->addWeeks($i);

            $weekKey = $weekStart->toDateString();

            $weeks->push([
                'week_start' => $weekKey,
                'visits' => $weeklyCounts->get($weekKey, 0),
            ]);
        }

        /*
         * Split the time series into:
         *
         * 4 baseline weeks
         * 2 recent weeks
         */
        $baselineWeeks = $weeks->slice(
            0,
            self::BASELINE_WEEKS
        )->values();

        $recentWeeks = $weeks->slice(
            self::BASELINE_WEEKS,
            self::RECENT_WEEKS
        )->values();

        $baselineVisits = $baselineWeeks->pluck('visits');
        $recentVisits = $recentWeeks->pluck('visits');

        /*
         * Make sure we have enough historical
         * activity to establish a baseline.
         */
        $baselineVisitCount = $baselineVisits->sum();

        if ($baselineVisitCount < self::MIN_BASELINE_VISITS) {
            return null;
        }

        $baselineAverage = $baselineVisits->avg();
        $recentAverage = $recentVisits->avg();

        /*
         * Protect against division by zero.
         */
        if ($baselineAverage <= 0) {
            return null;
        }

        /*
         * Calculate how much the member's recent
         * attendance has declined relative to their
         * historical baseline.
         */
        $declinePercentage =
            (($baselineAverage - $recentAverage) / $baselineAverage) * 100;

        /*
         * The change is not significant enough.
         */
        if ($declinePercentage < self::DECLINE_THRESHOLD) {
            return null;
        }

        /*
         * Require both recent weeks to be below
         * 50% of the member's baseline.
         */
        $recentDeclineWeeks = $recentVisits->filter(
            fn ($visits) =>
                $visits < ($baselineAverage * 0.5)
        );

        if ($recentDeclineWeeks->count() < self::RECENT_WEEKS) {
            return null;
        }

        /*
         * Determine signal severity.
         */
        $severity = $declinePercentage >= self::HIGH_SEVERITY_THRESHOLD
            ? SignalSeverity::HIGH->value
            : SignalSeverity::MEDIUM->value;

        /*
         * Return the signal classification separately
         * from the evidence used to explain it.
         */
        return [
            'type' => SignalType::ATTENDANCE_DECLINE->value,

            'severity' => $severity,

            'evidence' => [
                'baseline_average' => round($baselineAverage, 2),

                'recent_average' => round($recentAverage, 2),

                'decline_percentage' => round(
                    $declinePercentage,
                    2
                ),

                'baseline_weeks' => $baselineWeeks->all(),

                'recent_weeks' => $recentWeeks->all(),

                'expected_visits_per_week' => $expectedVisitsPerWeek,
            ],
        ];
    }
}