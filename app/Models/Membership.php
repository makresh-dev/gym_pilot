<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membership extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'organization_id',
        'member_id',
        'membership_plan_id',
        'start_date',
        'end_date',
        'price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'price' => 'decimal:2',
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

    public function membershipPlan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function amountPaid(): float
    {
        return $this->relationLoaded('payments')
            ? (float) $this->payments->sum('amount')
            : (float) $this->payments()->sum('amount');
    }

    public function balanceDue(): float
    {
        return max(
            0,
            (float) $this->price - $this->amountPaid()
        );
    }

    public function getAmountPaidAttribute(): float
    {
        return $this->amountPaid();
    }

    public function getBalanceDueAttribute(): float
    {
        return $this->balanceDue();
    }

    public function isActive(?Carbon $date = null): bool
    {
        $date ??= Carbon::today();

        return $this->status === 'active'
            && $this->start_date->lte($date)
            && $this->end_date->gte($date);
    }

    public function isUpcoming(?Carbon $date = null): bool
    {
        $date ??= Carbon::today();

        return $this->start_date->gt($date);
    }

    public function isExpired(?Carbon $date = null): bool
    {
        $date ??= Carbon::today();

        return $this->end_date->lt($date);
    }

    public function getLifecycleStatusAttribute(): string
    {
        $today = Carbon::today();

        if ($this->isUpcoming($today)) {
            return 'upcoming';
        }

        if ($this->isExpired($today)) {
            return 'expired';
        }

        if ($this->isActive($today)) {
            return 'active';
        }

        return 'inactive';
    }

    public function scopeCurrentlyActive(
        Builder $query,
        ?Carbon $date = null
    ): Builder {
        $date ??= Carbon::today();

        return $query
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date);
    }
}