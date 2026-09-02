<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Services\Intelligence\AttendanceDeclineDetector;
use App\Services\Intelligence\AttendanceDeclineResolver;
use App\Services\Intelligence\SignalService;
use Illuminate\Console\Command;

class DetectMemberSignals extends Command
{
    protected $signature = 'gym:detect-signals';

    protected $description = 'Detect member behavior signals';

    public function handle(
        AttendanceDeclineDetector $detector,
        SignalService $signalService,
        AttendanceDeclineResolver $resolver
    ): int {
        $members = Member::query()->get();

        $detected = 0;
        $resolved = 0;

        foreach ($members as $member) {
            /*
             * First check whether this member already has
             * an open attendance-decline signal.
             */
            $openSignal = $member->signals()
                ->where('type', 'attendance_decline')
                ->where('status', 'open')
                ->latest('detected_at')
                ->first();

            if ($openSignal) {
                if ($resolver->resolve($openSignal)) {
                    $resolved++;
                }

                continue;
            }

            /*
             * No open signal exists, so evaluate the
             * member for a new attendance-decline signal.
             */
            $detection = $detector->detect($member);

            if ($detection === null) {
                continue;
            }

            $signalService->createFromDetection(
                $member,
                $detection
            );

            $detected++;
        }

        $this->info(
            "Signal detection complete. {$detected} signal(s) detected, "
            . "{$resolved} signal(s) resolved."
        );

        return self::SUCCESS;
    }
}