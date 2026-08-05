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
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->string('origem')->default('aplicativo')->after('servico_id');
            $table->string('cliente')->nullable()->after('quem_pagou');
            $table->string('categoria')->nullable()->after('cliente');
            $table->string('forma_pagamento')->nullable()->after('categoria');
            $table->date('data_emissao')->nullable()->after('data_lancamento');
            $table->date('data_recebimento')->nullable()->after('data_vencimento');
            $table->text('observacoes')->nullable()->after('data_recebimento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->dropColumn([
                'origem',
                'cliente',
                'categoria',
                'forma_pagamento',
                'data_emissao',
                'data_recebimento',
                'observacoes',
            ]);
        });
    }
};
