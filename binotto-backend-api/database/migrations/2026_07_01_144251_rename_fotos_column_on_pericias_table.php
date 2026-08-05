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
            $table->renameColumn('fotos_tecnico', 'fotos');
            $table->renameColumn('fotos_pericia', 'fotos_pericia_completa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table) {
            $table->renameColumn('fotos', 'fotos_tecnico');
            $table->renameColumn('fotos_pericia_completa', 'fotos_pericia');
        });
    }
};
