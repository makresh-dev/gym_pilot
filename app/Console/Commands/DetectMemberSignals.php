<?php

namespace App\Console\Commands;

use App\Enums\SignalStatus;
use App\Enums\SignalType;
use App\Models\Member;
use App\Services\Intelligence\AttendanceDeclineDetector;
use App\Services\Intelligence\AttendanceDeclineResolver;
use App\Services\Intelligence\MembershipExpiryDetector;
use App\Services\Intelligence\MembershipExpiryResolver;
use App\Services\Intelligence\SignalService;
use Illuminate\Console\Command;

class DetectMemberSignals extends Command
{
    protected $signature = 'gym:detect-signals';

    protected $description = 'Detect member behavior signals';

    public function handle(
        AttendanceDeclineDetector $attendanceDetector,
        AttendanceDeclineResolver $attendanceResolver,
        MembershipExpiryDetector $membershipExpiryDetector,
        MembershipExpiryResolver $membershipExpiryResolver,
        SignalService $signalService,
    ): int {
        $members = Member::query()->get();

        $detected = 0;
        $resolved = 0;

        foreach ($members as $member) {
            /*
             * Attendance decline
             */
            $openAttendanceSignal = $member->signals()
                ->where('type', SignalType::ATTENDANCE_DECLINE->value)
                ->where('status', SignalStatus::OPEN->value)
                ->latest('detected_at')
                ->first();

            if ($openAttendanceSignal) {
                if ($attendanceResolver->resolve($openAttendanceSignal)) {
                    $resolved++;
                }
            } else {
                $attendanceDetection = $attendanceDetector->detect($member);

                if ($attendanceDetection !== null) {
                    $signalService->createFromDetection(
                        $member,
                        $attendanceDetection
                    );

                    $detected++;
                }
            }

            /*
             * Membership expiry
             */
            $openMembershipExpirySignal = $member->signals()
                ->where('type', SignalType::MEMBERSHIP_EXPIRING->value)
                ->where('status', SignalStatus::OPEN->value)
                ->latest('detected_at')
                ->first();

            if ($openMembershipExpirySignal) {
                if ($membershipExpiryResolver->resolve($openMembershipExpirySignal)) {
                    $resolved++;
                }
            } else {
                $membershipDetection = $membershipExpiryDetector->detect($member);

                if ($membershipDetection !== null) {
                    $signalService->createFromDetection(
                        $member,
                        $membershipDetection
                    );

                    $detected++;
                }
            }
        }

        $this->info(
            "Signal detection complete. {$detected} signal(s) detected, "
            . "{$resolved} signal(s) resolved."
        );

        return self::SUCCESS;
    }
}