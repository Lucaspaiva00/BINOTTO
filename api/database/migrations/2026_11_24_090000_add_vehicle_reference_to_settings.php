<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('configuracoes_pericia', function (Blueprint $table) {
            $table->string('referencia_veiculo', 8)->default('placa');
        });
    }

    public function down(): void
    {
        Schema::table('configuracoes_pericia', fn (Blueprint $table) => $table->dropColumn('referencia_veiculo'));
    }
};
