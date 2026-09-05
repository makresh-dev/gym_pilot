<?php

namespace App\Enums;

enum FollowUpTaskStatus: string
{
    case PENDING = 'pending';
    case COMPLETED = 'completed';
    case SKIPPED = 'skipped';
}