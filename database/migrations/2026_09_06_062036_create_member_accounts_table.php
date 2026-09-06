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
        Schema::create('member_accounts', function (Blueprint $table) {
            $table->ulid('id')->primary();

            $table->foreignUlid('member_id')
                ->unique()
                ->constrained('members')
                ->cascadeOnDelete();

            $table->string('password');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_accounts');
    }
};