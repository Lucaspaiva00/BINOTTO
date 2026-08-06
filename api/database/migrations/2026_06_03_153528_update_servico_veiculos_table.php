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
            $table->dropColumn([
                'servico_pdr',
                'servico_pintura',
                'pecas',
                'aluminio',
            ]);

            $table->string('marca_modelo', 255)->nullable()->after('chassi');
            $table->json('reparos')->nullable()->after('ordem_servico');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->boolean('servico_pdr')->default(false);
            $table->boolean('servico_pintura')->default(false);
            $table->json('pecas')->nullable();
            $table->boolean('aluminio')->default(false);

            $table->dropColumn('reparos');
            $table->dropColumn('marca_modelo');
        });
    }
};
