<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('signals', function (Blueprint $table) {
            $table->string('dismissal_reason')->nullable();
            $table->text('dismissal_notes')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->foreignUlid('dismissed_by')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('signals', function (Blueprint $table) {
            $table->dropForeign(['dismissed_by']);

            $table->dropColumn([
                'dismissal_reason',
                'dismissal_notes',
                'dismissed_at',
                'dismissed_by',
            ]);
        });
    }
};