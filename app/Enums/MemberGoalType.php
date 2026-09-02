<?php

namespace App\Enums;

enum MemberGoalType: string
{
    case WEIGHT_LOSS = 'weight_loss';
    case MUSCLE_GAIN = 'muscle_gain';
    case GENERAL_FITNESS = 'general_fitness';
    case STRENGTH = 'strength';
    case COMPETITION = 'competition';
    case REHABILITATION = 'rehabilitation';
    case OTHER = 'other';
}