<?php

namespace App\Enums;

enum SignalType: string
{
    case ATTENDANCE_DECLINE = 'attendance_decline';
    case MEMBERSHIP_EXPIRING = 'membership_expiring';
}