<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->ulid('id')->primary();

            $table->foreignUlid('organization_id')
                ->constrained('organizations')
                ->restrictOnDelete();

            $table->foreignUlid('member_id')
                ->constrained('members')
                ->restrictOnDelete();

            $table->foreignUlid('signal_id')
                ->constrained('signals')
                ->restrictOnDelete();

            $table->string('type');

            $table->text('notes')->nullable();

            $table->text('outcome')->nullable();

            $table->timestamp('intervened_at');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};