<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class MembershipPlan extends Model
{
    use HasFactory,HasUlids;
    
    protected $fillable = [
        'organization_id',
        'name',
        'price',
        'duration_days',
        'is_active',
    ];

     protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
    
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function memberships(): HasMany
{
    return $this->hasMany(Membership::class, 'membership_plan_id');
}
    
   
}
