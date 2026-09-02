<?php

namespace App\Services\Intelligence;

use App\Enums\InterventionType;
use App\Enums\SignalStatus;
use App\Models\Intervention;
use App\Models\Signal;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InterventionService
{
    public function record(
        Signal $signal,
        InterventionType $type,
        ?string $notes = null,
        ?string $outcome = null,
    ): Intervention {
        if ($signal->status !== SignalStatus::OPEN) {
            throw new InvalidArgumentException(
                'An intervention can only be recorded for an open signal.'
            );
        }

        return DB::transaction(function () use (
            $signal,
            $type,
            $notes,
            $outcome
        ) {
            return $signal->interventions()->create([
                'organization_id' => $signal->organization_id,
                'member_id' => $signal->member_id,
                'type' => $type->value,
                'notes' => $notes,
                'outcome' => $outcome,
                'intervened_at' => now(),
            ]);
        });
    }
}