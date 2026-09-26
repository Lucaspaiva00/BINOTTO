<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pericias', function (Blueprint $table): void {
            $table->string('perito_nome', 160)->nullable();
            $table->string('marca', 100)->nullable();
            $table->string('modelo', 150)->nullable();
            $table->decimal('valor_desmontagem', 12, 2)->nullable();
            $table->decimal('valor_total', 12, 2)->nullable();
            $table->decimal('valor_sugerido_tecnico', 12, 2)->nullable();
            $table->decimal('coeficiente_aplicado', 12, 2)->nullable();
            $table->json('visibilidade_valores')->nullable();
        });
        Schema::create('configuracoes_pericia', function (Blueprint $table): void {
            $table->id();
            $table->decimal('coeficiente_eur', 12, 2)->default(0);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('configuracoes_pericia');
        Schema::table('pericias', fn (Blueprint $table) => $table->dropColumn([
            'perito_nome', 'marca', 'modelo', 'valor_desmontagem', 'valor_total',
            'valor_sugerido_tecnico', 'coeficiente_aplicado', 'visibilidade_valores'
        ]));
    }
};
