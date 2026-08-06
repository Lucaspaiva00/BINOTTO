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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique()->nullable();
            $table->string('senha');
            $table->string('whatsapp')->unique();
            $table->enum('perfil', ['TECNICO', 'OFICINA', 'ADMIN']);
            $table->boolean('ativo')->default(true);
            $table->string('cod_recuperacao', 6)->nullable();
            $table->timestamp('cod_expira_em')->nullable();
            $table->timestamp('cod_usado_em')->nullable();
            $table->enum('cod_canal', ['email', 'whatsapp'])->nullable();
            $table->json('permissoes')->nullable();
            $table->string('idioma', 5)->default('pt-BR');
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained('usuarios')->nullOnDelete()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
