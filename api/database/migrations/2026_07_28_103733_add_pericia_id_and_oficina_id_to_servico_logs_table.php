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
        Schema::table('servico_logs', function (Blueprint $table) {
            $table->foreignId('pericia_id')
                ->nullable()
                ->after('servico_id')
                ->constrained('pericias')
                ->nullOnDelete();

            $table->foreignId('oficina_id')->nullable()->after('tecnico_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servico_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pericia_id');
            $table->dropColumn('oficina_id');
        });
    }
};
