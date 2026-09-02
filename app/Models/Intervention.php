<?php

namespace App\Models;

use App\Enums\InterventionType;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intervention extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'signal_id',
        'type',
        'notes',
        'outcome',
        'intervened_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => InterventionType::class,
            'intervened_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function signal(): BelongsTo
    {
        return $this->belongsTo(Signal::class);
    }
}