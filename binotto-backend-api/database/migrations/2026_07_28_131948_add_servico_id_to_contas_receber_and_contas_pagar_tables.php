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
            $table->foreignId('servico_id')->nullable()->after('id')->constrained('servicos')->nullOnDelete();
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->foreignId('servico_id')->nullable()->after('id')->constrained('servicos')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->dropConstrainedForeignId('servico_id');
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->dropConstrainedForeignId('servico_id');
        });
    }
};
