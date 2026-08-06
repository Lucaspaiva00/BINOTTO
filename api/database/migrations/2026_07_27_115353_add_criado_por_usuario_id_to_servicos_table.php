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
        Schema::table('servicos', function (Blueprint $table) {
            $table->foreignId('criado_por_usuario_id')
                ->nullable()
                ->after('tecnico_id')
                ->constrained('usuarios')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('criado_por_usuario_id');
        });
    }
};
