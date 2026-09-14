<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('member_accounts', function (Blueprint $table) {
            $table->foreignUlid('organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->cascadeOnDelete();

            $table->index(['organization_id', 'member_id']);
        });

        // Backfill organization_id for existing member_accounts
        $accounts = DB::table('member_accounts')->get();
        foreach ($accounts as $account) {
            $member = DB::table('members')->where('id', $account->member_id)->first();
            if ($member) {
                DB::table('member_accounts')
                    ->where('id', $account->id)
                    ->update(['organization_id' => $member->organization_id]);
            }
        }

        Schema::table('members', function (Blueprint $table) {
            $table->index(['organization_id', 'phone']);
            $table->index(['organization_id', 'email']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['organization_id', 'check_in_at']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index(['organization_id', 'paid_at']);
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->index(['organization_id', 'status', 'end_date']);
        });

        Schema::table('signals', function (Blueprint $table) {
            $table->index(['organization_id', 'status', 'detected_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('signals', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'status', 'detected_at']);
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'status', 'end_date']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'paid_at']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'check_in_at']);
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'phone']);
            $table->dropIndex(['organization_id', 'email']);
        });

        Schema::table('member_accounts', function (Blueprint $table) {
            $table->dropIndex(['organization_id', 'member_id']);
            $table->dropConstrainedForeignId('organization_id');
        });
    }
};
