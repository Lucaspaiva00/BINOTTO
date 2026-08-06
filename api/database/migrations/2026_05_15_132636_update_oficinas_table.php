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
            $table->string('cnpj')->nullable()->after('nome_fantasia');
            $table->string('razao_social')->nullable()->after('nome_fantasia');
            $table->string('email_secundario')->nullable()->after('nome_responsavel');
            $table->string('telefone_secundario')->nullable()->after('nome_responsavel');
            $table->string('numero', 10)->nullable()->after('telefone_secundario');
            $table->string('rua')->nullable()->after('numero');
            $table->string('complemento')->nullable()->after('rua');
            $table->string('cidade')->nullable()->after('complemento');
            $table->string('cep')->nullable()->after('cidade');
            $table->string('estado')->nullable()->after('cep');
            $table->string('pais')->nullable()->after('estado');
            $table->string('prazo_pagamento')->nullable()->after('pais');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oficinas', function (Blueprint $table) {
            $table->dropColumn([
                'cnpj',
                'razao_social',
                'email_secundario',
                'telefone_secundario',
                'numero',
                'rua',
                'complemento',
                'cidade',
                'cep',
                'estado',
                'pais',
                'prazo_pagamento',
            ]);
        });
    }
};
