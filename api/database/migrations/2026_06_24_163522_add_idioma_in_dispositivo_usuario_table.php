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
        Schema::table('dispositivos_usuario', function (Blueprint $table) {
            $table->string('idioma', 5)->default('pt-BR')->after('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dispositivos_usuario', function (Blueprint $table) {
            $table->dropColumn('idioma');
        });
    }
};
