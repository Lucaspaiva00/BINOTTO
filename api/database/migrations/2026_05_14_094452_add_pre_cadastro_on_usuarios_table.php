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
        Schema::table('usuarios', function (Blueprint $table) {
            $table->integer('pre_cadastro')->default(0)->after('perfil');
            $table->string('senha_convite')->nullable()->after('pre_cadastro');
            $table->foreignId('oficina_id_convite')->nullable()->after('senha_convite')->constrained('oficinas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropForeign(['oficina_id_convite']);
            $table->dropColumn('oficina_id_convite');
            $table->dropColumn('senha_convite');
            $table->dropColumn('pre_cadastro');
        });
    }
};
