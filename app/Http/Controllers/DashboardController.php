<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Models\Membership;
use App\Models\Signal;
use App\Services\Intelligence\ActionRecommendationService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        ActionRecommendationService $recommendationService
    ): Response {
        $user = auth()->user();

        $organizationId = $user->organization_id;
        $today = Carbon::today();

        /*
         * Members with a currently valid membership.
         */
        $activeMembers = Member::query()
            ->where('organization_id', $organizationId)
            ->whereHas('memberships', function ($query) use ($today) {
                $query
                    ->where('status', 'active')
                    ->whereDate('start_date', '<=', $today)
                    ->whereDate('end_date', '>=', $today);
            })
            ->count();

        /*
         * Check-ins recorded today.
         */
        $todayCheckIns = Attendance::query()
            ->where('organization_id', $organizationId)
            ->whereDate('check_in_at', $today)
            ->count();

        /*
         * Memberships expiring within the next 7 days.
         */
        $expiringMemberships = Membership::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereBetween('end_date', [
                $today,
                $today->copy()->addDays(7),
            ])
            ->count();

        /*
         * Open signals requiring attention.
         */
        $openSignals = Signal::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'open')
            ->count();

        /*
         * Outstanding balance across active memberships.
         */
        $outstandingBalance = Membership::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->with('payments')
            ->get()
            ->sum(function (Membership $membership) {
                return $membership->balanceDue();
            });

        /*
         * Latest open signals for the dashboard.
         */
        $signals = Signal::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'open')
            ->with('member:id,name,phone')
            ->latest('detected_at')
            ->limit(10)
            ->get()
            ->map(function (Signal $signal) use ($recommendationService) {
                return [
                    'id' => $signal->id,

                    'member' => [
                        'id' => $signal->member->id,
                        'name' => $signal->member->name,
                        'phone' => $signal->member->phone,
                    ],

                    'type' => $signal->type->value,

                    'severity' => $signal->severity->value,

                    'evidence' => $signal->evidence,

                    'detected_at' => $signal->detected_at->toISOString(),

                    'recommendation' => $recommendationService->recommend(
                        $signal
                    ),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'active_members' => $activeMembers,
                'today_check_ins' => $todayCheckIns,
                'expiring_memberships' => $expiringMemberships,
                'open_signals' => $openSignals,
                'outstanding_balance' => round(
                    $outstandingBalance,
                    2
                ),
            ],

            'signals' => $signals,
        ]);
    }
}