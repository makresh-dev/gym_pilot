<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\MemberAccount;
use App\Models\Organization;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AttendanceQrController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService,
    ) {
    }

    public function show(string $token): JsonResponse
    {
        $organization = Organization::query()
            ->where('attendance_qr_token', $token)
            ->first();

        if (! $organization) {
            return response()->json([
                'message' => 'Invalid GymPilot QR code.',
            ], 404);
        }

        return response()->json([
            'organization' => [
                'name' => $organization->name,
            ],
        ]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $account = $this->resolveMemberAccount($request);

        if (! $account) {
            return response()->json([
                'message' => 'Invalid member authentication.',
            ], 401);
        }

        $member = $account->member;

        if (! $member) {
            return response()->json([
                'message' => 'Member account is not linked to a member.',
            ], 401);
        }

        $organization = Organization::query()
            ->where('attendance_qr_token', $validated['token'])
            ->first();

        if (! $organization) {
            return response()->json([
                'message' => 'Invalid GymPilot QR code.',
            ], 404);
        }

        if ($member->organization_id !== $organization->id) {
            return response()->json([
                'message' => 'This QR code does not belong to your gym.',
            ], 403);
        }

        try {
            $attendance = $this->attendanceService->checkIn(
                $member,
                'qr',
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => 'Attendance marked successfully.',
            'attendance' => [
                'id' => $attendance->id,
                'check_in_at' => $attendance->check_in_at,
                'source' => $attendance->source,
            ],
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $account = $this->resolveMemberAccount($request);

        if (! $account) {
            return response()->json([
                'message' => 'Invalid member authentication.',
            ], 401);
        }

        $member = $account->member;

        if (! $member) {
            return response()->json([
                'message' => 'Member account is not linked to a member.',
            ], 401);
        }

        $today = today();

        $todayAttendance = $member->attendances()
            ->whereDate('check_in_at', $today)
            ->latest('check_in_at')
            ->first();

        $attendances = $member->attendances()
            ->latest('check_in_at')
            ->limit(30)
            ->get([
                'id',
                'check_in_at',
                'source',
            ]);

        return response()->json([
            'checked_in_today' => $todayAttendance !== null,
            'today_check_in_at' => $todayAttendance?->check_in_at,
            'attendances' => $attendances,
        ]);
    }

    private function resolveMemberAccount(
        Request $request,
    ): ?MemberAccount {
        $user = $request->user();

        if ($user instanceof MemberAccount) {
            return $user->loadMissing('member');
        }

        $token = $user?->currentAccessToken();

        if (! $token) {
            return null;
        }

        $tokenable = $token->tokenable;

        if (! $tokenable instanceof MemberAccount) {
            return null;
        }

        return $tokenable->loadMissing('member');
    }
}