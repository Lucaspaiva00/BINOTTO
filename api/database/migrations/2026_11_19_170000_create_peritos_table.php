<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('peritos', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 160);
            $table->string('nome_normalizado', 160)->unique();
        });

        DB::table('pericias')->whereNull('tecnico_id')->whereNotNull('perito_nome')
            ->select('id', 'perito_nome')->chunkById(500, function ($pericias) {
                foreach ($pericias as $pericia) {
                    $nome = trim($pericia->perito_nome);
                    if ($nome !== '') {
                        DB::table('peritos')->insertOrIgnore(['nome' => $nome, 'nome_normalizado' => mb_strtolower($nome)]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('peritos');
    }
};
