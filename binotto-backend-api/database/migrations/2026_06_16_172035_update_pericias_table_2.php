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
        Schema::table('pericias', function (Blueprint $table) {
            $table->json('fotos_tecnico')
                ->nullable()
                ->after('fotos_pericia');

            $table->renameColumn('preco_total', 'preco_sugerido');
            $table->renameColumn('finalizada_em', 'concluida_em');
            $table->renameColumn('avarias', 'reparos_necessarios');
        });

        Schema::table('pericias', function (Blueprint $table) {
            $table->decimal('preco_sugerido', 8, 2)
                ->nullable()
                ->change();

            $table->decimal('valor_pericia', 8, 2)
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table) {
            $table->dropColumn('fotos_tecnico');
            $table->renameColumn('preco_sugerido', 'preco_total');
            $table->renameColumn('concluida_em', 'finalizada_em');
            $table->renameColumn('reparos_necessarios', 'avarias');
        });

        Schema::table('pericias', function (Blueprint $table) {
            $table->decimal('preco_total', 8, 2)
                ->nullable(false)
                ->change();

            $table->decimal('valor_pericia', 8, 2)
                ->nullable(false)
                ->change();
        });
    }
};
