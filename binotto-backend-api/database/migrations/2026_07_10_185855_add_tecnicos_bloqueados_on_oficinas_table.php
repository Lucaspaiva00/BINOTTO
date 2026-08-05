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
        Schema::table('oficinas', function (Blueprint $table) {
            $table->json('tecnicos_bloqueados')->nullable()->after('tecnicos_preferidos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('oficinas', function (Blueprint $table) {
            $table->dropColumn('tecnicos_bloqueados');
        });
    }
};
