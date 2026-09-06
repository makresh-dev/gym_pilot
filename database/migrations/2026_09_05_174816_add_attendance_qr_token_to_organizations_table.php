<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table
                ->string('attendance_qr_token', 64)
                ->nullable()
                ->unique();
        });

        // Give existing organizations a QR token.
        //
        // New organizations will receive their token from the
        // Organization model when they are created.
        \App\Models\Organization::query()
            ->whereNull('attendance_qr_token')
            ->each(function ($organization) {
                $organization->update([
                    'attendance_qr_token' => Str::random(64),
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropUnique([
                'organizations_attendance_qr_token_unique',
            ]);

            $table->dropColumn('attendance_qr_token');
        });
    }
};