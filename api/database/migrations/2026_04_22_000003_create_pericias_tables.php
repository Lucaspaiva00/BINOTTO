<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pericias', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->string('placa', 16);
            $table->string('modelo', 120);
            $table->string('chassi', 80)->nullable();
            $table->decimal('custo_tecnico_total', 12, 2)->default(0);
            $table->decimal('preco_venda_total', 12, 2)->default(0);
            $table->decimal('margem_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('pericia_pecas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('pericia_id')->constrained('pericias')->cascadeOnDelete();
            $table->string('codigo_peca', 80);
            $table->string('nome_peca', 120);
            $table->enum('tipo_reparo', ['PDR', 'PINTURA', 'TROCA', 'ALUMINIO']);
            $table->unsignedInteger('quantidade_amassados')->default(0);
            $table->json('fotos')->nullable();
            $table->decimal('custo_tecnico', 12, 2)->default(0);
            $table->decimal('preco_venda', 12, 2)->default(0);
            $table->decimal('margem', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pericia_pecas');
        Schema::dropIfExists('pericias');
    }
};