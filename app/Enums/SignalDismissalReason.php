<?php

namespace App\Enums;

enum SignalDismissalReason: string
{
    case MEMBER_TRAVELLING = 'member_travelling';
    case ALREADY_HANDLED = 'already_handled';
    case NOT_RELEVANT = 'not_relevant';
    case MEMBER_REQUESTED_PAUSE = 'member_requested_pause';
    case OTHER = 'other';

    public function getLabel(): string
    {
        return match ($this) {
            self::MEMBER_TRAVELLING => 'Member is travelling',
            self::ALREADY_HANDLED => 'Already handled elsewhere',
            self::NOT_RELEVANT => 'Not relevant',
            self::MEMBER_REQUESTED_PAUSE => 'Member requested a pause',
            self::OTHER => 'Other',
        };
    }
}