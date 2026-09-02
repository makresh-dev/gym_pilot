<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Organization extends Model
{
    use HasUlids, SoftDeletes;
    protected $fillable = [
        'name',
        'slug',
    ];

    public function users(): HasMany
        {
            return $this->hasMany(User::class);
            
        }

        public function members(): HasMany
        {
            return $this->hasMany(Member::class);
            
        }

        public function membershipPlans(): HasMany
        {
            return $this->hasMany(MembershipPlan::class);
        }

        public function memberships(): HasMany
        {
            return $this->hasMany(Membership::class);
        }

        public function interventions(): HasMany
        {
            return $this->hasMany(Intervention::class);
        }

        public function signals(): HasMany
        {
            return $this->hasMany(Signal::class);
        }

}
