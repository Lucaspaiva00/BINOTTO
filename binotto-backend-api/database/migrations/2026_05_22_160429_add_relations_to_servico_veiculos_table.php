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
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->foreignId('oficina_id')
                ->nullable()
                ->after('servico_id')
                ->constrained('oficinas')
                ->nullOnDelete();

            $table->foreignId('tecnico_id')
                ->nullable()
                ->after('oficina_id')
                ->constrained('tecnicos')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->dropForeign(['oficina_id']);
            $table->dropForeign(['tecnico_id']);
            $table->dropColumn(['oficina_id', 'tecnico_id']);
        });
    }
};
