<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\MemberAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function show(Request $request): JsonResponse
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

        $membership = $member->memberships()
            ->with('membershipPlan')
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->orderBy('end_date')
            ->first();

        if (! $membership) {
            return response()->json([
                'membership' => null,
            ]);
        }

        return response()->json([
            'membership' => [
                'id' => $membership->id,
                'plan' => [
                    'id' => $membership->membershipPlan?->id,
                    'name' => $membership->membershipPlan?->name,
                ],
                'status' => $membership->lifecycle_status,
                'start_date' => $membership->start_date,
                'end_date' => $membership->end_date,
                'price' => $membership->price,
                'amount_paid' => $membership->amount_paid,
                'balance_due' => $membership->balance_due,
            ],
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