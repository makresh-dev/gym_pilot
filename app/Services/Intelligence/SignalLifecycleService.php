<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Models\Signal;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SignalLifecycleService
{
    public function resolve(Signal $signal): Signal
    {
        $this->ensureOpen($signal);

        return DB::transaction(function () use ($signal) {
            $signal->update([
                'status' => SignalStatus::RESOLVED->value,
                'resolved_at' => now(),
            ]);

            return $signal->refresh();
        });
    }

    public function dismiss(Signal $signal): Signal
    {
        $this->ensureOpen($signal);

        return DB::transaction(function () use ($signal) {
            $signal->update([
                'status' => SignalStatus::DISMISSED->value,
                'resolved_at' => now(),
            ]);

            return $signal->refresh();
        });
    }

    private function ensureOpen(Signal $signal): void
    {
        if ($signal->status !== SignalStatus::OPEN) {
            throw new InvalidArgumentException(
                'Only open signals can be resolved or dismissed.'
            );
        }
    }
}