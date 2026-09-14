<?php

namespace App\Services\Tenancy;

use App\Models\Organization;

class TenantContext
{
    protected ?Organization $organization = null;

    /**
     * Get the active organization instance, or null if none is active.
     */
    public function getOrganization(): ?Organization
    {
        return $this->organization;
    }

    /**
     * Get the active organization ID, or null if none is active.
     */
    public function getTenantId(): ?string
    {
        return $this->organization?->id;
    }

    /**
     * Set the currently active organization.
     */
    public function setTenant(Organization|string|null $organization): void
    {
        if ($organization === null) {
            $this->organization = null;
            return;
        }

        if (is_string($organization)) {
            $this->organization = Organization::findOrFail($organization);
            return;
        }

        $this->organization = $organization;
    }

    /**
     * Clear the currently active organization context.
     */
    public function clearTenant(): void
    {
        $this->organization = null;
    }

    /**
     * Determine whether a tenant context is currently set.
     */
    public function hasTenant(): bool
    {
        return $this->organization !== null;
    }

    /**
     * Execute a callback in the context of the given tenant, restoring the previous context afterwards.
     */
    public function executeInTenant(Organization|string $organization, callable $callback): mixed
    {
        $previousOrganization = $this->organization;

        $this->setTenant($organization);

        try {
            return $callback();
        } finally {
            $this->organization = $previousOrganization;
        }
    }

    /**
     * Static accessor for active organization model.
     */
    public static function organization(): ?Organization
    {
        return app(self::class)->getOrganization();
    }

    /**
     * Static accessor for active organization model.
     */
    public static function get(): ?Organization
    {
        return app(self::class)->getOrganization();
    }

    /**
     * Static accessor for active organization ID.
     */
    public static function id(): ?string
    {
        return app(self::class)->getTenantId();
    }

    /**
     * Static setter for active organization context.
     */
    public static function set(Organization|string|null $organization): void
    {
        app(self::class)->setTenant($organization);
    }

    /**
     * Static clear for active organization context.
     */
    public static function clear(): void
    {
        app(self::class)->clearTenant();
    }

    /**
     * Static check if an active organization context is established.
     */
    public static function has(): bool
    {
        return app(self::class)->hasTenant();
    }

    /**
     * Execute a callback within an explicit tenant context and restore prior state upon completion or failure.
     */
    public static function runInTenant(Organization|string $organization, callable $callback): mixed
    {
        return app(self::class)->executeInTenant($organization, $callback);
    }
}
