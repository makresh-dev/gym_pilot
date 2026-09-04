<?php

namespace App\Services\Intelligence;

use App\Enums\SignalDismissalReason;
use App\Enums\SignalStatus;
use App\Models\Signal;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SignalLifecycleService
{
    public function resolve(Signal $signal): Signal
    {
        if ($signal->status !== SignalStatus::OPEN) {
            throw new InvalidArgumentException(
                'Only open signals can be resolved.'
            );
        }

        $signal->status = SignalStatus::RESOLVED;
        $signal->resolved_at = now();

        $signal->save();

        return $signal;
    }

    public function dismiss(
        Signal $signal,
        SignalDismissalReason $reason,
        ?string $notes = null,
        ?string $dismissedBy = null,
    ): Signal {
        if ($signal->status !== SignalStatus::OPEN) {
            throw new InvalidArgumentException(
                'Only open signals can be dismissed.'
            );
        }

        return DB::transaction(function () use (
            $signal,
            $reason,
            $notes,
            $dismissedBy,
        ) {
            $signal->status = SignalStatus::DISMISSED;
            $signal->dismissal_reason = $reason;
            $signal->dismissal_notes = $notes;
            $signal->dismissed_at = now();
            $signal->dismissed_by = $dismissedBy;

            $signal->save();

            return $signal->refresh();
        });
    }
}