<?php

namespace App\Enums;

enum SignalStatus: string
{
    case OPEN = 'open';
    case RESOLVED = 'resolved';
    case DISMISSED = 'dismissed';
}