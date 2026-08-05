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
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropColumn('cidade');
            $table->string('tecnico_label', 255)->nullable()->after('data_fim');
            $table->string('oficina_label', 255)->nullable()->after('tecnico_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servicos', function (Blueprint $table) {
            $table->dropColumn([
                'tecnico_label',
                'oficina_label'
            ]);

             $table->string('cidade', 120)->after('data_fim');
        });
    }
};
