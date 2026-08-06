<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tecnicos', function (Blueprint $table): void {
            $table->string('nacionalidade')->nullable()->after('apelido');
            $table->json('disponibilidade_geografica')->nullable()->after('nacionalidade');
        });
    }

    public function down(): void
    {
        Schema::table('tecnicos', function (Blueprint $table): void {
            $table->dropColumn([
                'nacionalidade',
                'disponibilidade_geografica',
            ]);
        });
    }
};
