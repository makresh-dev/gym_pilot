<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Models\Membership;
use App\Models\Signal;
use App\Services\Intelligence\ActionRecommendationService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        ActionRecommendationService $recommendationService
    ): Response {
        $user = auth()->user();

        $organizationId = $user->organization_id;

        /*
         * Members with a currently valid membership.
         */
        $activeMembers = Member::query()
            ->where('organization_id', $organizationId)
            ->whereHas('memberships', function ($query) {
                $query->currentlyActive();
            })
            ->count();

        /*
         * Check-ins recorded today.
         */
        $todayCheckIns = Attendance::query()
            ->where('organization_id', $organizationId)
            ->whereDate('check_in_at', today())
            ->count();

        /*
         * Memberships expiring within the next 7 days.
         */
        $expiringMemberships = Membership::query()
            ->where('organization_id', $organizationId)
            ->currentlyActive()
            ->whereBetween('end_date', [
                today(),
                today()->addDays(7),
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
         * Outstanding balance across currently active memberships.
         */
        $outstandingBalance = Membership::query()
            ->where('organization_id', $organizationId)
            ->currentlyActive()
            ->with('payments')
            ->get()
            ->sum(function (Membership $membership) {
                return $membership->balanceDue();
            });

        /*
         * Latest open signals for the dashboard.
         *
         * Priority order:
         *   1. High severity
         *   2. Medium severity
         *   3. Low severity
         *
         * Within the same severity, newest signals appear first.
         *
         * We also load interventions so the dashboard can show
         * the latest action already taken by staff.
         */
        $signals = Signal::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'open')
            ->with([
                'member:id,name,phone',
                'interventions' => function ($query) {
                    $query->latest('intervened_at');
                },
            ])
            ->orderByRaw("
                CASE severity
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                    ELSE 4
                END
            ")
            ->latest('detected_at')
            ->limit(10)
            ->get()
            ->map(function (Signal $signal) use ($recommendationService) {
                $latestIntervention = $signal->interventions->first();

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

                    /*
                     * Latest intervention recorded against this signal.
                     *
                     * Null means the staff has not recorded an
                     * intervention yet.
                     */
                    'latest_intervention' => $latestIntervention
                        ? [
                            'type' => $latestIntervention->type->value,

                            'notes' => $latestIntervention->notes,

                            'outcome' => $latestIntervention->outcome,

                            'intervened_at' => $latestIntervention
                                ->intervened_at
                                ->toISOString(),
                        ]
                        : null,
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