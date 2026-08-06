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
        Schema::create('servicos_recusados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('servico_id')->constrained('servicos')->cascadeOnDelete();
            $table->foreignId('tecnico_id')->constrained('tecnicos')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['servico_id', 'tecnico_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicos_recusados');
    }
};
