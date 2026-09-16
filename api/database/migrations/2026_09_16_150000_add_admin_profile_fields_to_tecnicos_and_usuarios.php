<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('telefone_titular', 120)->nullable()->after('numero_telefone');
        });

        Schema::table('tecnicos', function (Blueprint $table) {
            $table->string('telefone_secundario_titular', 120)->nullable()->after('telefone_secundario');
            $table->json('idiomas')->nullable();
            $table->string('banco_nome', 180)->nullable();
            $table->string('banco_iban', 80)->nullable();
            $table->string('banco_swift', 40)->nullable();
            $table->string('banco_endereco', 255)->nullable();
        });

        Schema::table('oficinas', function (Blueprint $table) {
            $table->string('telefone_secundario_titular', 120)->nullable()->after('telefone_secundario');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', fn (Blueprint $table) => $table->dropColumn('telefone_titular'));
        Schema::table('tecnicos', fn (Blueprint $table) => $table->dropColumn(['telefone_secundario_titular', 'idiomas', 'banco_nome', 'banco_iban', 'banco_swift', 'banco_endereco']));
        Schema::table('oficinas', fn (Blueprint $table) => $table->dropColumn('telefone_secundario_titular'));
    }
};
