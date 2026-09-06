<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\MemberAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MemberAuthController extends Controller
{
    /**
     * Authenticate a gym member and issue a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:30',
            ],
            'password' => [
                'required',
                'string',
            ],
        ]);

        $account = MemberAccount::query()
            ->with('member')
            ->whereHas('member', function ($query) use ($validated) {
                $query->where('phone', $validated['phone']);
            })
            ->first();

        if (
            ! $account ||
            ! $account->member ||
            ! Hash::check($validated['password'], $account->password)
        ) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        $token = $account
            ->createToken('gym-pilot-mobile')
            ->plainTextToken;

        return response()->json([
            'message' => 'Signed in successfully.',
            'token' => $token,
            'member' => [
                'id' => $account->member->id,
                'name' => $account->member->name,
                'phone' => $account->member->phone,
                'email' => $account->member->email,
            ],
        ]);
    }

    /**
     * Return the currently authenticated member.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var MemberAccount $account */
        $account = $request->user();

        $account->loadMissing('member');

        return response()->json([
            'member' => [
                'id' => $account->member->id,
                'name' => $account->member->name,
                'phone' => $account->member->phone,
                'email' => $account->member->email,
            ],
        ]);
    }

    /**
     * Revoke the current mobile token.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var MemberAccount $account */
        $account = $request->user();

        $account->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Signed out successfully.',
        ]);
    }
}