<?php

namespace Tests\Unit;

use App\Models\Attendance;
use App\Models\Member;
use App\Services\Intelligence\AttendanceDeclineDetector;
use Carbon\Carbon;
use Tests\TestCase;

class AttendanceDeclineDetectorTest extends TestCase
{
    public function test_it_detects_a_persistent_attendance_decline(): void
    {
        Carbon::setTestNow(
            Carbon::parse('2026-09-02 12:00:00')
        );

        $member = Member::factory()->create();

        $today = Carbon::today()->startOfWeek();

        $attendanceByWeek = [
            -6 => 4,
            -5 => 4,
            -4 => 5,
            -3 => 4,
            -2 => 1,
            -1 => 1,
        ];

        foreach ($attendanceByWeek as $weekOffset => $visitCount) {
            $weekStart = $today->copy()->addWeeks($weekOffset);

            for ($i = 0; $i < $visitCount; $i++) {
                $member->attendances()->create([
                    'organization_id' => $member->organization_id,
                    'check_in_at' => $weekStart->copy()->addDays($i),
                    'source' => 'manual',
                ]);
            }
        }

        $detector = new AttendanceDeclineDetector();

        $result = $detector->detect($member);

        $this->assertNotNull($result);
        $this->assertSame('ATTENDANCE_DECLINE', $result['type']);
        $this->assertSame('high', $result['severity']);
        $this->assertSame(4.25, $result['baseline_average']);
        $this->assertSame(1.0, $result['recent_average']);
        $this->assertSame(76.47, $result['decline_percentage']);
    }
}