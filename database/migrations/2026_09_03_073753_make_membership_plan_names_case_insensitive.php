<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE membership_plans
             DROP CONSTRAINT IF EXISTS membership_plans_organization_name_unique'
        );

        DB::statement(
            'CREATE UNIQUE INDEX membership_plans_organization_name_unique
             ON membership_plans (organization_id, LOWER(name))'
        );
    }

    public function down(): void
    {
        DB::statement(
            'DROP INDEX IF EXISTS membership_plans_organization_name_unique'
        );

        DB::statement(
            'ALTER TABLE membership_plans
             ADD CONSTRAINT membership_plans_organization_name_unique
             UNIQUE (organization_id, name)'
        );
    }
};