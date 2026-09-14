<?php

namespace App\Models;

use App\Models\Scopes\MemberAccountTenantScope;
use App\Services\Tenancy\Exceptions\TenantContextMissingException;
use App\Services\Tenancy\Exceptions\TenantMismatchException;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class MemberAccount extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'member_id',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new MemberAccountTenantScope());

        static::creating(function (MemberAccount $account) {
            if (empty($account->member_id)) {
                throw new TenantContextMissingException(
                    'Cannot create MemberAccount without an associated member_id.'
                );
            }

            $member = $account->relationLoaded('member')
                ? $account->member
                : Member::withoutTenantScope()->find($account->member_id);

            if (! $member) {
                throw new TenantMismatchException('Cannot create MemberAccount: referenced member does not exist.');
            }

            if (TenantContext::has()) {
                $activeTenantId = TenantContext::id();

                if ((string) $member->organization_id !== (string) $activeTenantId) {
                    throw new TenantMismatchException(
                        sprintf(
                            'Cannot create MemberAccount for member [%s] belonging to organization [%s] while active TenantContext is [%s].',
                            $member->id,
                            $member->organization_id,
                            $activeTenantId
                        )
                    );
                }
            }
        });
    }

    /**
     * @return BelongsTo<Member, $this>
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    /**
     * Resolve the organization through the owning Member relation (Phase 1 indirect tenancy).
     */
    public function organization(): HasOneThrough
    {
        return $this->hasOneThrough(
            Organization::class,
            Member::class,
            'id',
            'id',
            'member_id',
            'organization_id'
        );
    }

    /**
     * Explicit platform-level query builder without tenant scoping.
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope(MemberAccountTenantScope::class);
    }

    /**
     * Local scope to bypass tenant scoping on an existing builder instance.
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope(MemberAccountTenantScope::class);
    }
}