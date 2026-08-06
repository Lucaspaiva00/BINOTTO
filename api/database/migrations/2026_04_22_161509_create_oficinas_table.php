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
        Schema::create('oficinas', function (Blueprint $table) {
            $table->id();
            $table->string('nome_fantasia');
            $table->string('nome_responsavel');
            $table->unsignedBigInteger('usuario_id')->unique();
            $table->foreign('usuario_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oficinas');
    }
};
