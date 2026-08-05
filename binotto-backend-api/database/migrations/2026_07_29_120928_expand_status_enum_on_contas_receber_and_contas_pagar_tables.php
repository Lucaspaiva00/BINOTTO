<?php

use App\Enums\FinanceiroStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $values = implode(',', array_map(
            fn ($case) => "'{$case->value}'",
            FinanceiroStatusEnum::cases()
        ));

        DB::statement("ALTER TABLE contas_receber MODIFY status ENUM({$values}) NOT NULL DEFAULT '".FinanceiroStatusEnum::PENDENTE->value."'");
        DB::statement("ALTER TABLE contas_pagar MODIFY status ENUM({$values}) NOT NULL DEFAULT '".FinanceiroStatusEnum::PENDENTE->value."'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE contas_receber MODIFY status ENUM('pendente','confirmado') NOT NULL DEFAULT 'pendente'");
        DB::statement("ALTER TABLE contas_pagar MODIFY status ENUM('pendente','confirmado') NOT NULL DEFAULT 'pendente'");
    }
};
