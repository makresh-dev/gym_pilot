<?php

namespace App\Models\Scopes;

use App\Models\MemberAccount;
use App\Services\Tenancy\Exceptions\TenantContextMissingException;
use App\Services\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * @implements Scope<MemberAccount>
 */
class MemberAccountTenantScope implements Scope
{
    /**
     * Apply the member account tenant scope through the member relation.
     *
     * @throws TenantContextMissingException
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (! TenantContext::has()) {
            throw new TenantContextMissingException(
                sprintf(
                    'Tenant-scoped model [%s] was queried without an active TenantContext. ' .
                    'Establish a tenant context via TenantContext::set(), execute within TenantContext::runInTenant(), ' .
                    'or explicitly call %s::withoutTenantScope() for authorized platform operations.',
                    $model::class,
                    $model::class
                )
            );
        }

        $builder->whereHas('member', function (Builder $query) {
            $query->where('members.organization_id', TenantContext::id());
        });
    }
}
