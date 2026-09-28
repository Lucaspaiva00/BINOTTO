<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE pericias DROP CONSTRAINT IF EXISTS pericias_status_check');
            DB::statement("ALTER TABLE pericias ADD CONSTRAINT pericias_status_check CHECK (status IN ('aberta','em_execucao','concluida','cancelada'))");
        } elseif (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE pericias MODIFY status ENUM('aberta','em_execucao','concluida','cancelada') NOT NULL DEFAULT 'aberta'");
        }

        Schema::table('servico_veiculos', function (Blueprint $table): void {
            $table->string('marca', 100)->nullable();
            $table->string('modelo', 150)->nullable();
            $table->json('fotos_veiculo')->nullable();
        });
        Schema::table('servicos', function (Blueprint $table): void {
            // Valores e percentuais são configurações, não lançamentos financeiros automáticos.
            $table->json('precos_detalhados')->nullable();
        });
    }

    public function down(): void
    {
        DB::table('pericias')->where('status', 'cancelada')->update(['status' => 'aberta']);
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE pericias DROP CONSTRAINT IF EXISTS pericias_status_check');
            DB::statement("ALTER TABLE pericias ADD CONSTRAINT pericias_status_check CHECK (status IN ('aberta','em_execucao','concluida'))");
        } elseif (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE pericias MODIFY status ENUM('aberta','em_execucao','concluida') NOT NULL DEFAULT 'aberta'");
        }

        Schema::table('servico_veiculos', fn (Blueprint $table) => $table->dropColumn(['marca', 'modelo', 'fotos_veiculo']));
        Schema::table('servicos', fn (Blueprint $table) => $table->dropColumn('precos_detalhados'));
    }
};
