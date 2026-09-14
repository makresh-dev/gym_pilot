<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use App\Models\Scopes\TenantScope;
use App\Services\Tenancy\Exceptions\TenantContextMissingException;
use App\Services\Tenancy\Exceptions\TenantMismatchException;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    /**
     * Boot the tenant scoping and assignment behavior for the model.
     */
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function (Model $model) {
            $activeTenantId = TenantContext::id();

            if (TenantContext::has()) {
                if (! empty($model->organization_id)) {
                    if ((string) $model->organization_id !== (string) $activeTenantId) {
                        throw new TenantMismatchException(
                            sprintf(
                                'Cannot create [%s] for organization [%s] while active TenantContext is [%s].',
                                $model::class,
                                $model->organization_id,
                                $activeTenantId
                            )
                        );
                    }
                } else {
                    $model->organization_id = $activeTenantId;
                }
            } else {
                if (empty($model->organization_id)) {
                    throw new TenantContextMissingException(
                        sprintf(
                            'Cannot create [%s] without an active TenantContext or an explicitly provided organization_id.',
                            $model::class
                        )
                    );
                }
            }
        });
    }

    /**
     * The organization that owns this model.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Explicit platform-level query builder without tenant scoping.
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope(TenantScope::class);
    }

    /**
     * Local scope to bypass tenant scoping for an existing query builder instance.
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope(TenantScope::class);
    }
}
