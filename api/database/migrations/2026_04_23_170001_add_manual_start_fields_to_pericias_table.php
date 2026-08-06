<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pericias', function (Blueprint $table): void {
            $table->enum('origem', ['OFICINA', 'INICIO_TECNICO'])->default('OFICINA')->after('usuario_id');
            $table->string('oficina_nome', 140)->nullable()->after('origem');
            $table->string('ordem_servico', 60)->nullable()->after('oficina_nome');
            $table->boolean('pericia_ativa')->default(true)->after('ordem_servico');
            $table->enum('tipo_sem_pericia', ['PDR', 'PINTURA'])->nullable()->after('pericia_ativa');
            $table->json('fotos_veiculo')->nullable()->after('tipo_sem_pericia');
            $table->json('fotos_pericia')->nullable()->after('fotos_veiculo');
        });
    }

    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table): void {
            $table->dropColumn([
                'origem',
                'oficina_nome',
                'ordem_servico',
                'pericia_ativa',
                'tipo_sem_pericia',
                'fotos_veiculo',
                'fotos_pericia',
            ]);
        });
    }
};
