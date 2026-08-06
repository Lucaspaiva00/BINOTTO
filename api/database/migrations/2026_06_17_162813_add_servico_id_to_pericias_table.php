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
            $table->foreignId('servico_id')
                ->nullable()
                ->after('veiculo_id')
                ->constrained('servicos')
                ->nullOnDelete();

            $table->dropConstrainedForeignId('veiculo_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table) {
            $table->foreignId('veiculo_id')
                ->nullable()
                ->after('oficina_id')
                ->constrained('servico_veiculos')
                ->nullOnDelete();
                
            $table->dropConstrainedForeignId('servico_id');
        });
    }
};
