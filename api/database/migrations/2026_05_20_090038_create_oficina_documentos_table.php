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
        Schema::create('oficina_documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oficina_id')->constrained('oficinas')->cascadeOnDelete();
            $table->string('nome');
            $table->string('arquivo');
            $table->string('url')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('tamanho')->nullable();
            $table->string('tipo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oficina_documentos');
    }
};
