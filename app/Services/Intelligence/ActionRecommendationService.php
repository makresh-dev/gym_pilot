<?php

namespace App\Services\Intelligence;

use App\Enums\SignalType;
use App\Models\Signal;

class ActionRecommendationService
{
    public function recommend(Signal $signal): ?array
    {
        return match ($signal->type) {
            SignalType::ATTENDANCE_DECLINE => [
                'type' => 'call_member',
                'label' => 'Call member',
                'reason' => 'Ask about the recent change in attendance.',
            ],

            SignalType::MEMBERSHIP_EXPIRY => [
                'type' => 'contact_member',
                'label' => 'Contact member',
                'reason' => 'Membership is expiring soon',
            ],

            default => null,
        };
    }
}