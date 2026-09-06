<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\FollowUpTask;
use App\Models\Member;
use App\Models\Membership;
use App\Models\Organization;
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

        $organization = Organization::query()
            ->select([
                'id',
                'name',
                'attendance_qr_token',
            ])
            ->findOrFail($organizationId);

        $today = today();

        /*
         * ------------------------------------------------------------------
         * Operational statistics
         * ------------------------------------------------------------------
         */

        $activeMembers = Member::query()
            ->where('organization_id', $organizationId)
            ->whereHas('memberships', function ($query) {
                $query->currentlyActive();
            })
            ->count();

        $todayCheckIns = Attendance::query()
            ->where('organization_id', $organizationId)
            ->whereDate('check_in_at', $today)
            ->count();

        $expiringMemberships = Membership::query()
            ->where('organization_id', $organizationId)
            ->currentlyActive()
            ->whereBetween('end_date', [
                $today,
                $today->copy()->addDays(7),
            ])
            ->count();

        $openSignals = Signal::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'open')
            ->count();

        $outstandingBalance = Membership::query()
            ->where('organization_id', $organizationId)
            ->currentlyActive()
            ->with('payments')
            ->get()
            ->sum(function (Membership $membership) {
                return $membership->balanceDue();
            });

        /*
         * ------------------------------------------------------------------
         * Open signals
         * ------------------------------------------------------------------
         *
         * High severity signals are especially useful for the daily queue.
         * We still expose medium/low signals separately so the dashboard
         * can show the broader intelligence context.
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

                    'latest_intervention' => $latestIntervention
                        ? [
                            'id' => $latestIntervention->id,
                            'type' => $latestIntervention->type->value,
                            'notes' => $latestIntervention->notes,
                            'outcome' => $latestIntervention->outcome,
                            'intervened_at' => $latestIntervention
                                ->intervened_at
                                ->toISOString(),
                        ]
                        : null,
                ];
            })
            ->values();

        /*
         * ------------------------------------------------------------------
         * Persistent follow-up tasks
         * ------------------------------------------------------------------
         *
         * We deliberately fetch only pending tasks here.
         *
         * The queue is split into:
         *
         *   overdue  -> due before today
         *   today    -> due today
         *   upcoming -> due after today
         *
         * This keeps the dashboard operational instead of becoming a
         * historical task list.
         */

        $followUpTasks = FollowUpTask::query()
            ->where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->with([
                'member:id,name',
                'intervention:id,signal_id,type,notes,outcome,intervened_at',
            ])
            ->orderBy('due_date')
            ->get([
                'id',
                'member_id',
                'intervention_id',
                'status',
                'due_date',
                'completed_at',
                'completion_notes',
            ]);

        $formatFollowUpTask = function (FollowUpTask $task): array {
            return [
                'id' => $task->id,

                'member' => [
                    'id' => $task->member->id,
                    'name' => $task->member->name,
                ],

                'intervention' => $task->intervention
                    ? [
                        'id' => $task->intervention->id,
                        'signal_id' => $task->intervention->signal_id,
                        'type' => $task->intervention->type->value,
                        'notes' => $task->intervention->notes,
                        'outcome' => $task->intervention->outcome,
                        'intervened_at' => $task->intervention
                            ->intervened_at
                            ->toISOString(),
                    ]
                    : null,

                'status' => $task->status->value,

                'due_date' => $task->due_date->toDateString(),

                'completed_at' => $task->completed_at?->toISOString(),

                'completion_notes' => $task->completion_notes,

                'is_overdue' => $task->due_date->isBefore(today()),
            ];
        };

        $overdueFollowUps = $followUpTasks
            ->filter(
                fn (FollowUpTask $task) =>
                    $task->due_date->isBefore($today)
            )
            ->map($formatFollowUpTask)
            ->values();

        $todayFollowUps = $followUpTasks
            ->filter(
                fn (FollowUpTask $task) =>
                    $task->due_date->isSameDay($today)
            )
            ->map($formatFollowUpTask)
            ->values();

        $upcomingFollowUps = $followUpTasks
            ->filter(
                fn (FollowUpTask $task) =>
                    $task->due_date->isAfter($today)
            )
            ->map($formatFollowUpTask)
            ->values();

        /*
         * ------------------------------------------------------------------
         * High-priority signals
         * ------------------------------------------------------------------
         *
         * These are surfaced as "Act now" candidates.
         */

        $highPrioritySignals = $signals
            ->filter(
                fn (array $signal) =>
                    $signal['severity'] === 'high'
            )
            ->values();

        /*
         * ------------------------------------------------------------------
         * Daily work queue
         * ------------------------------------------------------------------
         *
         * This is intentionally derived from existing data.
         *
         * No new database entity is needed.
         */

        $dailyWorkQueue = [
            'overdue' => [
                'count' => $overdueFollowUps->count(),
                'follow_ups' => $overdueFollowUps,
            ],

            'today' => [
                'count' =>
                    $todayFollowUps->count()
                    + $highPrioritySignals->count(),

                'follow_ups' => $todayFollowUps,

                'high_priority_signals' => $highPrioritySignals,
            ],

            'upcoming' => [
                'count' => $upcomingFollowUps->count(),
                'follow_ups' => $upcomingFollowUps,
            ],
        ];

        /*
         * ------------------------------------------------------------------
         * GymPilot attendance QR
         * ------------------------------------------------------------------
         *
         * The QR identifies the gym only.
         *
         * It does not contain:
         *   - member ID
         *   - email
         *   - phone number
         *   - other member information
         *
         * The mobile app will identify the member through authentication.
         */

        $attendanceQr = [
            'organization_id' => $organization->id,

            'organization_name' => $organization->name,

            'payload' => sprintf(
                'gympilot://check-in/%s',
                $organization->attendance_qr_token
            ),
        ];

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

            'followUpTasks' => $followUpTasks
                ->map($formatFollowUpTask)
                ->values(),

            'dailyWorkQueue' => $dailyWorkQueue,

            'attendanceQr' => $attendanceQr,
        ]);
    }
}