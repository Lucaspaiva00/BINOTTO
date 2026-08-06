<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('iso_pais_telefone', 2)->nullable()->after('codigo_pais_telefone');
        });

        Schema::table('oficinas', function (Blueprint $table) {
            $table->string('iso_pais_telefone_secundario', 2)->nullable()->after('codigo_pais_telefone_secundario');
        });

        Schema::table('tecnicos', function (Blueprint $table) {
            $table->string('iso_pais_telefone_secundario', 2)->nullable()->after('codigo_pais_telefone_secundario');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('pais_iso');
        });

        Schema::table('oficinas', function (Blueprint $table) {
            $table->dropColumn('iso_pais_telefone_secundario');
        });

        Schema::table('tecnicos', function (Blueprint $table) {
            $table->dropColumn('iso_pais_telefone_secundario');
        });
    }
};