<?php

namespace App\Enums;

enum InterventionType: string
{
    case CALL_MEMBER = 'call_member';
    case SEND_WHATSAPP = 'send_whatsapp';
    case IN_PERSON = 'in_person';
    case FOLLOW_UP = 'follow_up';
    case OTHER = 'other';
}