<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Models\Membership;
use App\Models\Signal;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\Intelligence\ActionRecommendationService;

class DashboardController extends Controller
{
    public function __invoke(ActionRecommendationService $recommendationService
    ): Response {
        $user = auth()->user();

        $organizationId = $user->organization_id;

        $today = Carbon::today();

        $activeMembers = Member::query()
            ->where('organization_id', $organizationId)
            ->count();

        $todayCheckIns = Attendance::query()
            ->where('organization_id', $organizationId)
            ->whereDate('check_in_at', $today)
            ->count();

        $expiringMemberships = Membership::query()
            ->where('organization_id', $organizationId)
            ->whereBetween('end_date', [
                $today,
                $today->copy()->addDays(7),
            ])
            ->where('status', 'active')
            ->count();

        $openSignals = Signal::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'open')
            ->count();

        $outstandingBalance = Membership::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->with('payments')
            ->get()
            ->sum(function (Membership $membership) {
                return $membership->balanceDue();
            });


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