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

        $attendances = Attendance::query()
            ->where('organization_id', $organizationId)
            ->whereDate('check_in_at', $date)
            ->with([
                'member:id,name,phone',
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
                return [
                    'id' => $attendance->id,
                    'member' => [
                        'id' => $attendance->member->id,
                        'name' => $attendance->member->name,
                        'phone' => $attendance->member->phone,
                    ],
                    'check_in_at' => $attendance->check_in_at,
                    'source' => $attendance->source,
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
