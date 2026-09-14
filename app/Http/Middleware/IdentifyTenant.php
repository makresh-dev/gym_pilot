<?php

namespace App\Http\Middleware;

use App\Models\MemberAccount;
use App\Models\User;
use App\Services\Tenancy\Exceptions\TenantContextMissingException;
use App\Services\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request and establish the active TenantContext.
     *
     * @throws TenantContextMissingException
     */
    public function handle(Request $request, Closure $next): Response
    {
        $principal = $request->user()
            ?? auth('member')->user()
            ?? auth('web')->user();

        if (! $principal) {
            throw new TenantContextMissingException(
                'Unauthenticated request cannot establish a tenant context.'
            );
        }

        if ($principal instanceof User) {
            if (empty($principal->organization_id)) {
                throw new TenantContextMissingException(
                    'Authenticated user does not belong to an organization.'
                );
            }

            $organization = $principal->organization;

            if (! $organization) {
                throw new TenantContextMissingException(
                    'Organization associated with authenticated user does not exist.'
                );
            }

            TenantContext::set($organization);
        } elseif ($principal instanceof MemberAccount) {
            /** @var \App\Models\Member|null $member */
            $member = $principal->member;

            if (! $member || empty($member->organization_id)) {
                throw new TenantContextMissingException(
                    'Authenticated member account is not linked to a valid member or organization.'
                );
            }

            /** @var \App\Models\Organization|null $organization */
            $organization = $member->organization;

            if (! $organization) {
                throw new TenantContextMissingException(
                    'Organization associated with authenticated member does not exist.'
                );
            }

            TenantContext::set($organization);
        } else {
            throw new TenantContextMissingException(
                sprintf('Unsupported principal type [%s] for tenant identification.', get_class($principal))
            );
        }

        try {
            return $next($request);
        } finally {
            TenantContext::clear();
        }
    }
}
