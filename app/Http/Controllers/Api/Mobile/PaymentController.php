<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\MemberAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
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

        $payments = $member->payments()
            ->with([
                'membership.membershipPlan',
            ])
            ->latest('paid_at')
            ->limit(50)
            ->get();

        return response()->json([
            'payments' => $payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'payment_method' => $payment->payment_method->value,
                    'paid_at' => $payment->paid_at,
                    'membership' => $payment->membership ? [
                        'id' => $payment->membership->id,
                        'plan_name' => $payment->membership
                            ->membershipPlan
                            ?->name,
                    ] : null,
                ];
            })->values(),
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