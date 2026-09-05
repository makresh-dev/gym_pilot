<?php

namespace App\Services\Intelligence;

use App\Enums\SignalStatus;
use App\Models\Intervention;
use App\Models\Member;
use App\Models\Signal;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;

class InterventionService
{
    private const DEFAULT_FOLLOW_UP_DAYS = 7;

    public function __construct(
        private readonly FollowUpTaskService $followUpTaskService,
    ) {
    }

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
                'Interventions can only be recorded for open signals.',
            );
        }

        return DB::transaction(function () use (
            $signal,
            $member,
            $type,
            $notes,
            $outcome,
            $intervenedAt,
        ): Intervention {
            /*
             * Use the provided intervention time when available.
             * Otherwise, use the current application time.
             */
            $interventionDate = $intervenedAt
                ? Carbon::parse($intervenedAt)
                : now();

            $intervention = Intervention::create([
                'organization_id' => $member->organization_id,
                'member_id' => $member->id,
                'signal_id' => $signal->id,
                'type' => $type,
                'notes' => $notes,
                'outcome' => $outcome,
                'intervened_at' => $interventionDate,
            ]);

            /*
             * Every intervention gets a persistent follow-up task.
             *
             * Solo Gym MVP:
             * assigned_to_user_id remains NULL.
             *
             * The operator sees the follow-up in the member profile
             * and dashboard without needing staff assignment.
             */
            $this->followUpTaskService->createFromIntervention(
                intervention: $intervention,
                dueDate: $interventionDate->copy()->addDays(
                    self::DEFAULT_FOLLOW_UP_DAYS,
                ),
            );

            return $intervention;
        });
    }
}