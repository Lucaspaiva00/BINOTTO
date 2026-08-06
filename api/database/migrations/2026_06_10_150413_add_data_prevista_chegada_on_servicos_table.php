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
        Schema::table('servicos', function (Blueprint $table): void {
            $table->date('data_prevista_chegada')->nullable()->after('fotos_servico');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table): void {
            $table->dropColumn('data_prevista_chegada');
        });
    }
};
