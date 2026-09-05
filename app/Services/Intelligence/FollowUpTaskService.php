<?php

namespace App\Services\Intelligence;

use App\Enums\FollowUpTaskStatus;
use App\Models\FollowUpTask;
use App\Models\Intervention;
use Carbon\CarbonInterface;
use DomainException;
use Illuminate\Support\Facades\DB;

class FollowUpTaskService
{
    public function createFromIntervention(
        Intervention $intervention,
        CarbonInterface $dueDate,
        ?string $assignedToUserId = null,
    ): FollowUpTask {
        if (! $intervention->organization_id || ! $intervention->member_id) {
            throw new DomainException(
                'An intervention must belong to an organization and member.',
            );
        }

        return DB::transaction(function () use (
            $intervention,
            $dueDate,
            $assignedToUserId,
        ): FollowUpTask {
            /*
             * An intervention should have at most one active follow-up task.
             *
             * This protects us from accidentally creating duplicate
             * follow-ups if the intervention-recording flow is called
             * more than once.
             */
            $existingTask = FollowUpTask::query()
                ->where('organization_id', $intervention->organization_id)
                ->where('intervention_id', $intervention->id)
                ->where('status', FollowUpTaskStatus::PENDING)
                ->first();

            if ($existingTask) {
                return $existingTask;
            }

            return FollowUpTask::create([
                'organization_id' => $intervention->organization_id,
                'member_id' => $intervention->member_id,
                'assigned_to_user_id' => $assignedToUserId,
                'intervention_id' => $intervention->id,
                'status' => FollowUpTaskStatus::PENDING,
                'due_date' => $dueDate->toDateString(),
            ]);
        });
    }

    public function complete(
        FollowUpTask $followUpTask,
        ?string $completionNotes = null,
    ): FollowUpTask {
        if ($followUpTask->status !== FollowUpTaskStatus::PENDING) {
            throw new DomainException(
                'Only pending follow-up tasks can be completed.',
            );
        }

        $followUpTask->update([
            'status' => FollowUpTaskStatus::COMPLETED,
            'completed_at' => now(),
            'completion_notes' => $completionNotes,
        ]);

        return $followUpTask->refresh();
    }

    public function skip(
        FollowUpTask $followUpTask,
        ?string $completionNotes = null,
    ): FollowUpTask {
        if ($followUpTask->status !== FollowUpTaskStatus::PENDING) {
            throw new DomainException(
                'Only pending follow-up tasks can be skipped.',
            );
        }

        $followUpTask->update([
            'status' => FollowUpTaskStatus::SKIPPED,
            'completed_at' => now(),
            'completion_notes' => $completionNotes,
        ]);

        return $followUpTask->refresh();
    }

    public function reopen(
        FollowUpTask $followUpTask,
    ): FollowUpTask {
        if ($followUpTask->status === FollowUpTaskStatus::PENDING) {
            return $followUpTask;
        }

        $followUpTask->update([
            'status' => FollowUpTaskStatus::PENDING,
            'completed_at' => null,
            'completion_notes' => null,
        ]);

        return $followUpTask->refresh();
    }
}