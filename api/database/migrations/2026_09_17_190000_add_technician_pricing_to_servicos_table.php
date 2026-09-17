<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('servicos', 'preco_tecnico')) {
            Schema::table('servicos', function (Blueprint $table) {
                $table->decimal('preco_tecnico', 10, 2)->nullable()->after('valor_total');
            });
        }

        if (! Schema::hasColumn('servicos', 'percentual_tecnico')) {
            Schema::table('servicos', function (Blueprint $table) {
                $table->decimal('percentual_tecnico', 5, 2)->nullable()->after('preco_tecnico');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('servicos', 'percentual_tecnico')) {
            Schema::table('servicos', function (Blueprint $table) {
                $table->dropColumn('percentual_tecnico');
            });
        }

        // preco_tecnico já existe em algumas bases antigas sem migration registrada.
        // Não removemos no rollback para não destruir dados legados.
    }
};
