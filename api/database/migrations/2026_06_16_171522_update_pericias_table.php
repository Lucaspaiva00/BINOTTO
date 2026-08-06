<?php

use App\Enums\PericiaStatusEnum;
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
            $table->foreignId('veiculo_id')
                ->nullable()
                ->after('id')
                ->constrained('servico_veiculos')
                ->nullOnDelete();

            $table->enum('status', array_column(PericiaStatusEnum::cases(), 'value'))
                ->default(PericiaStatusEnum::ABERTA->value)
                ->after('tipo');

            $table->dropColumn([
                'marca',
                'modelo',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pericias', function (Blueprint $table) {
            $table->dropForeign(['veiculo_id']);
            $table->dropColumn('veiculo_id');
            $table->dropColumn('status');
            $table->string('marca')->nullable();
            $table->string('modelo')->nullable();
        });
    }
};
