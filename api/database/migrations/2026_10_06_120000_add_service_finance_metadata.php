<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->string('referencia_veiculo_tipo', 10)->nullable()->after('servico_id');
            $table->string('fatura')->nullable()->after('forma_pagamento');
            $table->string('numero_fatura', 100)->nullable()->after('fatura');
            $table->string('status_fatura', 50)->nullable()->after('numero_fatura');
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->string('referencia_veiculo_tipo', 10)->nullable()->after('servico_id');
            $table->string('comissao')->nullable()->after('valor_pago');
            $table->string('fatura')->nullable()->after('forma_pagamento');
            $table->string('numero_fatura', 100)->nullable()->after('fatura');
        });
    }

    public function down(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->dropColumn(['referencia_veiculo_tipo', 'fatura', 'numero_fatura', 'status_fatura']);
        });
        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->dropColumn(['referencia_veiculo_tipo', 'comissao', 'fatura', 'numero_fatura']);
        });
    }
};
