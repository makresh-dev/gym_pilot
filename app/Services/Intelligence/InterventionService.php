<?php

namespace App\Services\Intelligence;


use App\Enums\InterventionType;
use App\Enums\SignalStatus;
use App\Models\Intervention;
use App\Models\Signal;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use DomainException;

class InterventionService
{
    public function record(
    Signal $signal,
    Member $member,
    string $type,
    ?string $notes = null,
    ?string $outcome = null,
    ?string $intervenedAt = null,
): Intervention {
    if ($signal->status !== SignalStatus::OPEN) {
        throw new DomainException(
            'Interventions can only be recorded for open signals.'
        );
    }

    return DB::transaction(function () use (
        $signal,
        $member,
        $type,
        $notes,
        $outcome,
        $intervenedAt,
    ) {
        return Intervention::create([
            'organization_id' => $member->organization_id,
            'member_id' => $member->id,
            'signal_id' => $signal->id,
            'type' => $type,
            'notes' => $notes,
            'outcome' => $outcome,
            'intervened_at' => $intervenedAt ?? now(),
        ]);
    });
}
}