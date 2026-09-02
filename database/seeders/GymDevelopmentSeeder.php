<?php

namespace Database\Seeders;

use App\Enums\InterventionType;
use App\Enums\MemberGoalType;
use App\Enums\PaymentMethod;
use App\Enums\SignalSeverity;
use App\Enums\SignalStatus;
use App\Enums\SignalType;
use App\Models\Attendance;
use App\Models\Intervention;
use App\Models\Member;
use App\Models\MemberExpectation;
use App\Models\MemberGoal;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Signal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class GymDevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * ---------------------------------------------------------
         * Organization
         * ---------------------------------------------------------
         */

        $organization = Organization::create([
            'name' => 'Raipur Strength Lab',
            'slug' => 'raipur-strength-lab',
        ]);

        /*
         * ---------------------------------------------------------
         * Owner
         * ---------------------------------------------------------
         */

        $owner = User::create([
            'organization_id' => $organization->id,
            'name' => 'Raipur Owner',
            'email' => 'owner@raipur.test',
            'password' => Hash::make('password'),
            'role' => 'owner',
        ]);

        /*
         * ---------------------------------------------------------
         * Members
         * ---------------------------------------------------------
         */

        $aarav = Member::create([
            'organization_id' => $organization->id,
            'name' => 'Aarav Sharma',
            'email' => 'aarav@example.test',
            'phone' => '9000000001',
            'date_of_birth' => '1998-05-12',
        ]);

        $rohan = Member::create([
            'organization_id' => $organization->id,
            'name' => 'Rohan Verma',
            'email' => 'rohan@example.test',
            'phone' => '9000000002',
            'date_of_birth' => '1995-11-20',
        ]);

        $priya = Member::create([
            'organization_id' => $organization->id,
            'name' => 'Priya Singh',
            'email' => null,
            'phone' => '9000000003',
            'date_of_birth' => '2000-02-18',
        ]);

        /*
         * ---------------------------------------------------------
         * Membership Plans
         * ---------------------------------------------------------
         */

        $monthlyPlan = MembershipPlan::create([
            'organization_id' => $organization->id,
            'name' => 'Monthly',
            'price' => 3000,
            'duration_days' => 30,
            'is_active' => true,
        ]);

        $quarterlyPlan = MembershipPlan::create([
            'organization_id' => $organization->id,
            'name' => 'Quarterly',
            'price' => 7500,
            'duration_days' => 90,
            'is_active' => true,
        ]);

        /*
         * ---------------------------------------------------------
         * Memberships
         * ---------------------------------------------------------
         */

        $aaravMembership = Membership::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'membership_plan_id' => $monthlyPlan->id,
            'start_date' => Carbon::today(),
            'end_date' => Carbon::today()->addDays(29),
            'price' => $monthlyPlan->price,
            'status' => 'active',
        ]);

        $rohanMembership = Membership::create([
            'organization_id' => $organization->id,
            'member_id' => $rohan->id,
            'membership_plan_id' => $quarterlyPlan->id,
            'start_date' => Carbon::today(),
            'end_date' => Carbon::today()->addDays(89),
            'price' => $quarterlyPlan->price,
            'status' => 'active',
        ]);

        /*
         * ---------------------------------------------------------
         * Payments
         * ---------------------------------------------------------
         */

        Payment::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'membership_id' => $aaravMembership->id,
            'amount' => 2000,
            'payment_method' => PaymentMethod::UPI,
            'paid_at' => now(),
        ]);

        Payment::create([
            'organization_id' => $organization->id,
            'member_id' => $rohan->id,
            'membership_id' => $rohanMembership->id,
            'amount' => 7500,
            'payment_method' => PaymentMethod::CASH,
            'paid_at' => now(),
        ]);

        /*
         * ---------------------------------------------------------
         * Member Expectations
         * ---------------------------------------------------------
         */

        MemberExpectation::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'visits_per_week' => 4,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        MemberExpectation::create([
            'organization_id' => $organization->id,
            'member_id' => $rohan->id,
            'visits_per_week' => 3,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        MemberExpectation::create([
            'organization_id' => $organization->id,
            'member_id' => $priya->id,
            'visits_per_week' => 2,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        /*
         * ---------------------------------------------------------
         * Member Goals
         * ---------------------------------------------------------
         */

        MemberGoal::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'goal' => MemberGoalType::MUSCLE_GAIN,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        MemberGoal::create([
            'organization_id' => $organization->id,
            'member_id' => $rohan->id,
            'goal' => MemberGoalType::STRENGTH,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        MemberGoal::create([
            'organization_id' => $organization->id,
            'member_id' => $priya->id,
            'goal' => MemberGoalType::GENERAL_FITNESS,
            'start_date' => Carbon::today()->startOfWeek(),
            'end_date' => null,
        ]);

        /*
         * ---------------------------------------------------------
         * Attendance
         *
         * Aarav:
         *   4, 4, 5, 4, 1, 1
         *
         * Rohan:
         *   3, 3, 3, 4, 3, 3
         *
         * Priya:
         *   1, 0, 1, 0, 0, 1
         * ---------------------------------------------------------
         */

        $today = Carbon::today()->startOfWeek();

        $attendancePatterns = [
            $aarav->id => [
                -6 => 4,
                -5 => 4,
                -4 => 5,
                -3 => 4,
                -2 => 1,
                -1 => 1,
            ],

            $rohan->id => [
                -6 => 3,
                -5 => 3,
                -4 => 3,
                -3 => 4,
                -2 => 3,
                -1 => 3,
            ],

            $priya->id => [
                -6 => 1,
                -5 => 0,
                -4 => 1,
                -3 => 0,
                -2 => 0,
                -1 => 1,
            ],
        ];

        foreach ($attendancePatterns as $memberId => $weeks) {
            foreach ($weeks as $weekOffset => $visitCount) {
                $weekStart = $today
                    ->copy()
                    ->addWeeks($weekOffset);

                $member = match ($memberId) {
                    $aarav->id => $aarav,
                    $rohan->id => $rohan,
                    $priya->id => $priya,
                };

                for ($i = 0; $i < $visitCount; $i++) {
                    Attendance::create([
                        'organization_id' => $organization->id,
                        'member_id' => $member->id,
                        'check_in_at' => $weekStart
                            ->copy()
                            ->addDays($i),
                        'source' => 'manual',
                    ]);
                }
            }
        }

        /*
         * ---------------------------------------------------------
         * Development signal
         *
         * We create one example signal for Aarav so the UI can
         * be developed before the scheduled detector is running.
         * ---------------------------------------------------------
         */

        $signal = Signal::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'type' => SignalType::ATTENDANCE_DECLINE,
            'severity' => SignalSeverity::HIGH,
            'status' => SignalStatus::OPEN,
            'evidence' => [
                'baseline_average' => 4.25,
                'recent_average' => 1.00,
                'decline_percentage' => 76.47,
                'baseline_weeks' => [
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(6)
                            ->toDateString(),
                        'visits' => 4,
                    ],
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(5)
                            ->toDateString(),
                        'visits' => 4,
                    ],
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(4)
                            ->toDateString(),
                        'visits' => 5,
                    ],
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(3)
                            ->toDateString(),
                        'visits' => 4,
                    ],
                ],
                'recent_weeks' => [
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(2)
                            ->toDateString(),
                        'visits' => 1,
                    ],
                    [
                        'week_start' => $today
                            ->copy()
                            ->subWeeks(1)
                            ->toDateString(),
                        'visits' => 1,
                    ],
                ],
                'expected_visits_per_week' => 4,
            ],
            'detected_at' => now(),
        ]);

        /*
         * ---------------------------------------------------------
         * Development intervention
         * ---------------------------------------------------------
         */

        Intervention::create([
            'organization_id' => $organization->id,
            'member_id' => $aarav->id,
            'signal_id' => $signal->id,
            'type' => InterventionType::CALL_MEMBER,
            'notes' => 'Called member regarding reduced attendance.',
            'outcome' => 'Member reported a temporary change in work schedule.',
            'intervened_at' => now(),
        ]);
    }
}