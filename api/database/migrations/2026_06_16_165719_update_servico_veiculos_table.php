<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pericia_id');
            $table->dropConstrainedForeignId('oficina_id');
            $table->dropConstrainedForeignId('tecnico_id');

            $table->dropColumn([
                'fotos_tecnico',
                'observacao_tecnico',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->foreignId('pericia_id')
                ->nullable()
                ->constrained('pericias')
                ->nullOnDelete();

            $table->foreignId('oficina_id')
                ->nullable()
                ->constrained('oficinas')
                ->nullOnDelete();

            $table->foreignId('tecnico_id')
                ->nullable()
                ->constrained('tecnicos')
                ->nullOnDelete();

            $table->json('fotos_tecnico')->nullable();
            $table->text('observacao_tecnico')->nullable();
        });
    }
};