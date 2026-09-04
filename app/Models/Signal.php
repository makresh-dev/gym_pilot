<?php

namespace App\Models;

use App\Enums\SignalDismissalReason;
use App\Enums\SignalSeverity;
use App\Enums\SignalStatus;
use App\Enums\SignalType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Signal extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'type',
        'severity',
        'status',
        'evidence',
        'detected_at',
        'resolved_at',
        'dismissal_reason',
        'dismissal_notes',
        'dismissed_at',
        'dismissed_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => SignalType::class,
            'severity' => SignalSeverity::class,
            'status' => SignalStatus::class,
            'dismissal_reason' => SignalDismissalReason::class,
            'evidence' => 'array',
            'detected_at' => 'datetime',
            'resolved_at' => 'datetime',
            'dismissed_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(
            Organization::class,
        );
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(
            Member::class,
        );
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(
            Intervention::class,
        );
    }

    public function dismissedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'dismissed_by',
        );
    }
}