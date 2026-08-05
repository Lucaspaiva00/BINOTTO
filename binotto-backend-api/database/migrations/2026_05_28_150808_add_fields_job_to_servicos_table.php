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
            $table->json('tecnicos_preferidos_notificados')->nullable()->after('status');
            $table->boolean('disponivel_para_todos')->default(true)->after('tecnicos_preferidos_notificados');
            $table->timestamp('liberado_para_todos_em')->nullable()->after('disponivel_para_todos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropColumn(['disponivel_para_todos', 'liberado_para_todos_em']);
        });
    }
};
