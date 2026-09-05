<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService
    ) {
    }

    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;

        $dateInput = $request->string('date')->toString();

        try {
            $date = $dateInput !== ''
                ? Carbon::createFromFormat('Y-m-d', $dateInput)->startOfDay()
                : today();
        } catch (\Throwable) {
            $date = today();
            $dateInput = '';
        }

        $search = trim(
            $request->string('search')->toString()
        );

        /*
         * Weekly context is calculated for the calendar week containing
         * the selected attendance date. Monday is treated as the first
         * day of the week.
         */
        $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $attendances = Attendance::query()
            ->where(
                'organization_id',
                $organizationId
            )
            ->whereDate('check_in_at', $date)
            ->with([
                'member' => function ($query) use (
                    $weekStart,
                    $weekEnd,
                ) {
                    $query
                        ->select([
                            'id',
                            'name',
                            'phone',
                        ])
                        ->withCount([
                            'attendances as weekly_visits' =>
                                function ($query) use (
                                    $weekStart,
                                    $weekEnd,
                                ) {
                                    $query
                                        ->whereBetween(
                                            'check_in_at',
                                            [
                                                $weekStart,
                                                $weekEnd,
                                            ],
                                        );
                                },
                        ])
                        ->with([
                            'signals' => function ($query) {
                                $query
                                    ->where(
                                        'type',
                                        'attendance_decline',
                                    )
                                    ->with([
                                        'interventions' => function ($query) {
                                            $query->latest(
                                                'intervened_at'
                                            );
                                        },
                                    ])
                                    ->latest('detected_at');
                            },
                        ]);
                },
            ])
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->whereHas(
                        'member',
                        function ($query) use ($search) {
                            $query
                                ->where(
                                    'name',
                                    'ilike',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'ilike',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->latest('check_in_at')
            ->get()
            ->map(function (Attendance $attendance) {
                $member = $attendance->member;

                $latestAttendanceSignal = $member->signals->first();

                $latestAttendanceIntervention =
                    $latestAttendanceSignal?->interventions->first();

                $expectedVisitsPerWeek = null;

                if ($latestAttendanceSignal) {
                    $expectedVisitsPerWeek =
                        $latestAttendanceSignal->evidence[
                            'expected_visits_per_week'
                        ] ?? null;
                }

                return [
                    'id' => $attendance->id,

                    'member' => [
                        'id' => $member->id,
                        'name' => $member->name,
                        'phone' => $member->phone,
                    ],

                    'check_in_at' => $attendance->check_in_at,

                    'source' => $attendance->source,

                    'context' => [
                        'weekly_visits' => (int) (
                            $member->weekly_visits ?? 0
                        ),

                        'has_open_attendance_signal' =>
                            $latestAttendanceSignal?->status === 'open',

                        'latest_attendance_signal_status' =>
                            $latestAttendanceSignal?->status,

                        'expected_visits_per_week' =>
                            $expectedVisitsPerWeek !== null
                                ? (float) $expectedVisitsPerWeek
                                : null,

                        'latest_intervention' =>
                            $latestAttendanceIntervention
                                ? [
                                    'type' =>
                                        $latestAttendanceIntervention
                                            ->type
                                            ->value,
                                    'notes' =>
                                        $latestAttendanceIntervention
                                            ->notes,
                                    'outcome' =>
                                        $latestAttendanceIntervention
                                            ->outcome,
                                    'intervened_at' =>
                                        $latestAttendanceIntervention
                                            ->intervened_at
                                            ->toISOString(),
                                ]
                                : null,
                    ],
                ];
            })
            ->values();

        return Inertia::render('Attendance/Index', [
            'attendances' => $attendances,
            'date' => $date->toDateString(),
            'search' => $search,
            'isToday' => $date->isToday(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $members = Member::query()
            ->where(
                'organization_id',
                $request->user()->organization_id
            )
            ->where(function ($query) use ($request) {
                $search = $request->string('query');

                $query
                    ->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            })
            ->orderBy('name')
            ->limit(10)
            ->get([
                'id',
                'name',
                'phone',
            ]);

        return response()->json($members);
    }

    public function store(Request $request)
    {
        $request->validate([
            'member_id' => ['required', 'string', 'exists:members,id'],
        ]);

        $member = Member::query()
            ->where(
                'organization_id',
                $request->user()->organization_id
            )
            ->findOrFail(
                $request->string('member_id')
            );

        try {
            $this->attendanceService->checkIn($member);
        } catch (RuntimeException $e) {
            return back()->withErrors([
                'member_id' => $e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            "{$member->name} checked in successfully."
        );
    }

    public function status(
        Request $request,
        Member $member
    ): JsonResponse {
        abort_unless(
            $member->organization_id ===
                $request->user()->organization_id,
            404
        );

        $today = today();

        $attendance = $member->attendances()
            ->whereDate('check_in_at', $today)
            ->latest('check_in_at')
            ->first();

        $membership = $member->memberships()
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->latest('end_date')
            ->first();

        return response()->json([
            'checked_in' => $attendance !== null,
            'check_in_at' => $attendance?->check_in_at,

            'membership_active' => $membership !== null,
            'membership_end_date' => $membership?->end_date,
        ]);
    }
}
