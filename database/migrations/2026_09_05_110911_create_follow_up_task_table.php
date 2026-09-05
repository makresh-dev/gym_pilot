<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('follow_up_tasks', function (Blueprint $table) {
            $table->ulid('id')->primary();

            $table->foreignUlid('organization_id')
                ->constrained('organizations')
                ->restrictOnDelete();

            $table->foreignUlid('member_id')
                ->constrained('members')
                ->restrictOnDelete();

            /*
             * Optional future staff assignment.
             *
             * MVP:
             * This remains NULL because the typical gym may have
             * only one operator/trainer.
             *
             * Later subscription tiers can expose assignment
             * without requiring a schema change.
             */
            $table->foreignUlid('assigned_to_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
             * Optional link to the intervention that caused this
             * follow-up task.
             */
            $table->foreignUlid('intervention_id')
                ->nullable()
                ->constrained('interventions')
                ->nullOnDelete();

            $table->string('status', 32)
                ->default('pending');

            $table->date('due_date');

            $table->timestamp('completed_at')
                ->nullable();

            $table->text('completion_notes')
                ->nullable();

            $table->timestamps();

            /*
             * Common operational queries:
             *
             * - organization + status + due date
             * - member follow-up history
             */
            $table->index([
                'organization_id',
                'status',
                'due_date',
            ]);

            $table->index([
                'organization_id',
                'member_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follow_up_tasks');
    }
};