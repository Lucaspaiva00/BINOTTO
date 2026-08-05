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
        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->dropColumn(['beneficiario', 'quem_recebeu']);
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->string('origem')->default('aplicativo')->after('servico_id');
            $table->foreignId('oficina_id')->nullable()->after('origem')->constrained('oficinas')->nullOnDelete();
            $table->foreignId('tecnico_id')->nullable()->after('oficina_id')->constrained('tecnicos')->nullOnDelete();
            $table->string('fornecedor')->nullable()->after('descricao');
            $table->string('categoria')->nullable()->after('fornecedor');
            $table->string('forma_pagamento')->nullable()->after('categoria');
            $table->date('data_emissao')->nullable()->after('data_lancamento');
            $table->date('data_pagamento')->nullable()->after('data_vencimento');
            $table->text('observacoes')->nullable()->after('data_pagamento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->dropConstrainedForeignId('oficina_id');
            $table->dropConstrainedForeignId('tecnico_id');
            $table->dropColumn([
                'origem',
                'fornecedor',
                'categoria',
                'forma_pagamento',
                'data_emissao',
                'data_pagamento',
                'observacoes',
            ]);
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->string('beneficiario')->nullable();
            $table->string('quem_recebeu')->nullable();
        });
    }
};
