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
        Schema::dropIfExists('pericia_pecas');

        Schema::table('pericias', function (Blueprint $table) {
            $table->dropConstrainedForeignId('usuario_id');
            
            $table->dropColumn([
                'origem',
                'oficina_nome',
                'ordem_servico',
                'pericia_ativa',
                'tipo_sem_pericia',
                'margem_total',
                'preco_venda_total',
                'fotos_veiculo'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

    }
};


