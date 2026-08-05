<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servico_veiculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('servico_id')->constrained('servicos')->cascadeOnDelete();
            $table->string('placa', 20)->nullable();
            $table->string('chassi', 30)->nullable();
            $table->string('marca', 120)->nullable();
            $table->string('modelo', 120)->nullable();
            $table->boolean('servico_pdr')->default(false);
            $table->boolean('servico_pintura')->default(false);
            $table->json('pecas')->nullable();
            $table->boolean('aluminio')->default(false);
            $table->decimal('preco_total', 10, 2)->nullable()->default(0);
            $table->json('fotos_tecnico')->nullable();
            $table->timestamp('finalizado_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servico_veiculos');
    }
};