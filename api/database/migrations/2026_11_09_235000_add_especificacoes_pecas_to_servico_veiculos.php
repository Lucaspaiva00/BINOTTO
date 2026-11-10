<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->json('especificacoes_pecas')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->dropColumn('especificacoes_pecas');
        });
    }
};
