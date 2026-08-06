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
            $table->renameColumn('exige_vistoria', 'pericia_completa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->renameColumn('pericia_completa', 'exige_vistoria');
        });
    }
};
