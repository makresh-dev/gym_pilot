<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Services\AttendanceService;
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

        $attendances = Member::query()
            ->where('organization_id', $organizationId)
            ->with([
                'attendances' => function ($query) {
                    $query
                        ->whereDate('check_in_at', today())
                        ->latest('check_in_at');
                },
            ])
            ->get()
            ->flatMap(function ($member) {
                return $member->attendances->map(function ($attendance) use ($member) {
                    return [
                        'id' => $attendance->id,
                        'member' => [
                            'id' => $member->id,
                            'name' => $member->name,
                            'phone' => $member->phone,
                        ],
                        'check_in_at' => $attendance->check_in_at,
                        'source' => $attendance->source,
                    ];
                });
            })
            ->sortByDesc('check_in_at')
            ->values();

        return Inertia::render('Attendance/Index', [
            'attendances' => $attendances,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $members = Member::query()
            ->where('organization_id', $request->user()->organization_id)
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
            ->where('organization_id', $request->user()->organization_id)
            ->findOrFail($request->string('member_id'));

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

    public function status(Request $request, Member $member): JsonResponse
{
    abort_unless(
        $member->organization_id === $request->user()->organization_id,
        404
    );

    $attendance = $member->attendances()
        ->whereDate('check_in_at', today())
        ->latest('check_in_at')
        ->first();

    return response()->json([
        'checked_in' => $attendance !== null,
        'check_in_at' => $attendance?->check_in_at,
    ]);
}
}