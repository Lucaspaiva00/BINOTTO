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
        Schema::create('servico_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('servico_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tecnico_id')->nullable();
            $table->string('tipo'); 
            $table->string('motivo')->nullable();
            $table->text('descricao')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servico_logs');
    }
};
