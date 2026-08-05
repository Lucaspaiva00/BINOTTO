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
                'marca',
                'modelo',
                'ordem_servico'
            ]);

            $table->renameColumn('reparos', 'reparos_execucao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->renameColumn('reparos_execucao', 'reparos');

            $table->string('marca', 120)->nullable();
            $table->string('modelo', 120)->nullable();
            $table->string('ordem_servico', 60)->nullable()->after('modelo');
        });
    }
};
