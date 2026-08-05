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
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('senha')->nullable()->change();
            $table->string('whatsapp')->nullable()->change();
            $table->dropColumn('permissoes');

            // login social
            $table->string('google_id')->nullable()->after('idioma')->index();
            $table->string('apple_id')->nullable()->after('google_id')->index();
            $table->string('facebook_id')->nullable()->after('apple_id')->index();

            // biometria
            $table->boolean('biometria_enabled')->default(false)->after('facebook_id');
            $table->text('biometria_hash')->nullable()->after('biometria_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('senha')->nullable(false)->change();
            $table->string('whatsapp')->nullable(false)->change();
            $table->json('permissoes')->nullable()->after('cod_canal');

            // remove campos novos
            $table->dropColumn([
                'google_id',
                'apple_id',
                'facebook_id',
                'biometria_enabled',
                'biometria_hash',
            ]);
        });
    }
};
