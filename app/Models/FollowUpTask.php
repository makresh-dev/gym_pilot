<?php

namespace App\Models;

use App\Enums\FollowUpTaskStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpTask extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'assigned_to_user_id',
        'intervention_id',
        'status',
        'due_date',
        'completed_at',
        'completion_notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => FollowUpTaskStatus::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * The organization that owns this follow-up task.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * The member this follow-up concerns.
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * Optional future staff assignment.
     *
     * This remains nullable for the Solo Gym MVP.
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * The intervention that created this follow-up, when applicable.
     */
    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    /**
     * Determine whether the task is still actionable.
     */
    public function isPending(): bool
    {
        return $this->status === FollowUpTaskStatus::PENDING;
    }

    /**
     * Determine whether the task is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->isPending()
            && $this->due_date->isBefore(today());
    }
}