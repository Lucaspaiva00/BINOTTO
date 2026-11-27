<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->string('status_anterior_cancelamento', 32)->nullable();
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->string('status_anterior_cancelamento', 32)->nullable();
        });

        Schema::table('servicos', function (Blueprint $table) {
            $table->string('status_anterior_cancelamento', 32)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('contas_receber', function (Blueprint $table) {
            $table->dropColumn('status_anterior_cancelamento');
        });

        Schema::table('contas_pagar', function (Blueprint $table) {
            $table->dropColumn('status_anterior_cancelamento');
        });

        Schema::table('servicos', function (Blueprint $table) {
            $table->dropColumn('status_anterior_cancelamento');
        });
    }
};
