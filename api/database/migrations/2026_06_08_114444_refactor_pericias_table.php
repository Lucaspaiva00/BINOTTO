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
        Schema::table('pericias', function (Blueprint $table) {
            $table->foreignId('oficina_id')->nullable()
                ->after('id')
                ->constrained('oficinas')
                ->nullOnDelete();

            $table->foreignId('tecnico_id')
                ->nullable()
                ->after('id')
                ->constrained('tecnicos')
                ->nullOnDelete();

            $table->string('placa', 20)->nullable()->change();
            $table->string('marca', 120)->nullable()->after('placa');
            $table->string('modelo', 120)->nullable()->change();
            $table->string('chassi', 30)->nullable()->change();
            $table->string('marca_modelo', 255)->nullable()->after('chassi');
            $table->enum('tipo', ['simples', 'completa'])->nullable()->after('marca_modelo');
            $table->json('avarias')->nullable()->after('tipo');
            $table->json('fotos_pericia')->nullable()->after('avarias')->change();
            $table->char('moeda', 3)->nullable()->default('EUR')->after('fotos_pericia');
            $table->renameColumn('custo_tecnico_total', 'preco_total');
            $table->decimal('preco_total', 8, 2)->default(0)->change();
            $table->decimal('valor_pericia', 8, 2)->default(0)->after('preco_total');
            $table->timestamp('finalizada_em')->nullable()->after('valor_pericia');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table) {

            $table->dropForeign(['oficina_id']);
            $table->dropColumn('oficina_id');

            $table->dropForeign(['tecnico_id']);
            $table->dropColumn('tecnico_id');

            $table->dropColumn([
                'marca',
                'marca_modelo',
                'avarias',
                'valor_pericia',
                'finalizada_em',
            ]);

            $table->renameColumn('preco_total', 'custo_tecnico_total');

            $table->string('placa', 16)->nullable(false)->change();
            $table->string('modelo', 120)->nullable(false)->change();
            $table->string('chassi', 80)->nullable()->change();

            $table->decimal('custo_tecnico_total', 12, 2)
                ->default(0)
                ->change();

            $table->json('fotos_pericia')->nullable()->change();
        });
    }
};
