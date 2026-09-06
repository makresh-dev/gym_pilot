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

    /**
     * Resolve a GymPilot attendance QR token.
     *
     * This endpoint only identifies the gym.
     * It does not authenticate a member or mark attendance.
     */
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

    /**
     * Mark attendance for the authenticated member using a gym QR token.
     *
     * The QR identifies the gym.
     * Sanctum identifies the member.
     *
     * AttendanceService remains the single authority for attendance rules.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => [
                'required',
                'string',
                'size:64',
            ],
        ]);

        $account = $request->user();

        if (! $account instanceof MemberAccount) {
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
}