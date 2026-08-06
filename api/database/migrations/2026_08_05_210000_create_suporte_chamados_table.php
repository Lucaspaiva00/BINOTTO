<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suporte_chamados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->string('assunto');
            $table->string('status', 20)->default('aberto');
            $table->timestamps();

            $table->index(['usuario_id', 'status']);
        });

        Schema::create('suporte_mensagens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chamado_id')->constrained('suporte_chamados')->cascadeOnDelete();
            $table->string('autor_tipo', 20);
            $table->unsignedBigInteger('autor_id')->nullable();
            $table->text('corpo');
            $table->timestamps();

            $table->index('chamado_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suporte_mensagens');
        Schema::dropIfExists('suporte_chamados');
    }
};
