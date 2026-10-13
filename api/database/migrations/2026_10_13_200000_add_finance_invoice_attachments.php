<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE servicos DROP CONSTRAINT IF EXISTS servicos_status_check');
            DB::statement("ALTER TABLE servicos ADD CONSTRAINT servicos_status_check CHECK (status IN ('aguardando','aguardando_aprovacao','aceito','em_execucao','em_breve','retrabalho','concluido','finalizado','cancelado','recusado'))");
        }
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE servicos MODIFY status ENUM('aguardando','aguardando_aprovacao','aceito','em_execucao','em_breve','retrabalho','concluido','finalizado','cancelado','recusado') NOT NULL DEFAULT 'aguardando'");
        }
        foreach (['contas_receber', 'contas_pagar'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->longText('fatura_conteudo')->nullable();
                $t->string('fatura_mime', 100)->nullable();
                $t->string('fatura_nome')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['contas_receber', 'contas_pagar'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn(['fatura_conteudo', 'fatura_mime', 'fatura_nome']));
        }
    }
};
