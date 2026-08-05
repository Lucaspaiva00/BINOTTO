<?php

use App\Enums\ServicoStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('solicitacoes_servicos');

        Schema::create('servicos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('oficina_id')->nullable()->constrained('oficinas')->cascadeOnDelete();
            $table->foreignId('tecnico_id')->nullable()->constrained('tecnicos')->nullOnDelete();
            $table->date('data_inicio')->nullable();
            $table->date('data_fim')->nullable();
            $table->string('cidade', 120)->nullable();
            $table->enum('quantidade_tipo', ['carros', 'dias']);
            $table->integer('quantidade')->nullable();
            $table->char('moeda', 3)->nullable()->default('BRL');
            $table->decimal('valor_total', 8, 2)->nullable();
            $table->integer('exige_vistoria')->default(0);
            $table->enum('status', array_column(ServicoStatusEnum::cases(), 'value'))->default(ServicoStatusEnum::AGUARDANDO->value);
            $table->text('observacoes')->nullable();
            $table->json('fotos_servico')->nullable();
            $table->time('horario_previsto_chegada')->nullable();
            $table->time('aceito_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicos');
    }
};