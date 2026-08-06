<?php

use App\Enums\FinanceiroStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contas_receber', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tecnico_id')->nullable()->constrained('tecnicos')->nullOnDelete();
            $table->foreignId('oficina_id')->nullable()->constrained('oficinas')->nullOnDelete();
            $table->string('descricao')->nullable();
            $table->decimal('valor_servico', 10, 2);
            $table->decimal('valor_plataforma', 10, 2)->nullable();
            $table->string('quem_pagou')->nullable();
            $table->date('data_lancamento')->nullable();
            $table->date('data_vencimento')->nullable();
            $table->enum('status', array_column(FinanceiroStatusEnum::cases(), 'value'))->default(FinanceiroStatusEnum::PENDENTE->value);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contas_receber');
    }
};
