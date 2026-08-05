<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table): void {
            $table->string('ordem_servico', 60)->nullable()->after('modelo');
            $table->text('observacao_tecnico')->nullable()->after('fotos_tecnico');
        });
    }

    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table): void {
            $table->dropColumn(['ordem_servico', 'observacao_tecnico']);
        });
    }
};
