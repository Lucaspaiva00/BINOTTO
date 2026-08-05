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
            $table->foreignId('pericia_id')
                ->nullable()
                ->after('servico_id')
                ->constrained('pericias')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servico_veiculos', function (Blueprint $table) {
            $table->dropForeign(['pericia_id']);
            $table->dropColumn('pericia_id');
        });
    }
};
