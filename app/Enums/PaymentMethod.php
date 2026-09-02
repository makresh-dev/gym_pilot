<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case UPI = 'upi';
    case CARD = 'card';
    case BANK_TRANSFER = 'bank_transfer';
    case OTHER = 'other';

    public function getLabel(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::UPI => 'UPI',
            self::CARD => 'Card',
            self::BANK_TRANSFER => 'Bank transfer',
            self::OTHER => 'Other',
        };
    }
}