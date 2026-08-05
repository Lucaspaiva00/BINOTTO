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
        Schema::table('oficinas', function (Blueprint $table) {
            $table->string('codigo_pais_telefone_secundario', 10)
                ->nullable()
                ->after('telefone_secundario');
        });

        Schema::table('tecnicos', function (Blueprint $table) {
            $table->string('codigo_pais_telefone_secundario', 10)
                ->nullable()
                ->after('telefone_secundario');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oficinas', function (Blueprint $table) {
            $table->dropColumn('codigo_pais_telefone_secundario');
        });

        Schema::table('tecnicos', function (Blueprint $table) {
            $table->dropColumn('codigo_pais_telefone_secundario');
        });
    }
};
