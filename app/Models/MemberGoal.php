<?php

namespace App\Models;

use App\Enums\MemberGoalType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberGoal extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'goal',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'goal' => MemberGoalType::class,
            'start_date' => 'date',
            'end_date' => 'date',
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
}