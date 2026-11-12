<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('painel_movimentacoes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('metodo', 8);
            $table->string('rota');
            $table->string('referencia')->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('painel_movimentacoes');
    }
};
