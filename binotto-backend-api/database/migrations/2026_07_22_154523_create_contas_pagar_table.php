<?php

use App\Enums\FinanceiroStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contas_pagar', function (Blueprint $table) {
            $table->id();
            $table->string('descricao')->nullable();
            $table->string('beneficiario')->nullable();
            $table->string('quem_recebeu')->nullable();
            $table->decimal('valor_a_pagar', 10, 2);
            $table->decimal('valor_pago', 10, 2)->default(0);
            $table->date('data_lancamento')->nullable();
            $table->date('data_vencimento')->nullable();
            $table->enum('status', array_column(FinanceiroStatusEnum::cases(), 'value'))->default(FinanceiroStatusEnum::PENDENTE->value);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contas_pagar');
    }
};
