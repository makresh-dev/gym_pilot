<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Models\Member;
use App\Models\Signal;

class SignalService
{
    public function createFromDetection(
        Member $member,
        array $detection
    ): Signal {
        $existingSignal = $member->signals()
            ->where('type', $detection['type'])
            ->where('status', SignalStatus::OPEN->value)
            ->latest('detected_at')
            ->first();

        if ($existingSignal) {
            return $existingSignal;
        }

        return $member->signals()->create([
            'organization_id' => $member->organization_id,
            'type' => $detection['type'],
            'severity' => $detection['severity'],
            'status' => SignalStatus::OPEN->value,
            'evidence' => $detection['evidence'],
            'detected_at' => now(),
        ]);
    }
}