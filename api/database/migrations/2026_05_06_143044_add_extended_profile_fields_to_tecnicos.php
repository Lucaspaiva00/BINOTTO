<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tecnicos', function (Blueprint $table): void {
            $table->string('telefone_secundario', 40)->nullable()->after('apelido');
            $table->date('data_nascimento')->nullable()->after('telefone_secundario');
            $table->string('nacionalidade_secundaria', 100)->nullable()->after('nacionalidade');
            $table->string('cpf', 20)->nullable()->after('nacionalidade_secundaria');
            $table->string('cnpj', 30)->nullable()->after('cpf');
            $table->string('nome_fantasia_empresa', 150)->nullable()->after('cnpj');
            $table->string('razao_social_empresa', 150)->nullable()->after('nome_fantasia_empresa');
            $table->string('endereco_rua', 180)->nullable()->after('nome_fantasia_empresa');
            $table->string('endereco_numero', 40)->nullable()->after('endereco_rua');
            $table->string('endereco_complemento', 120)->nullable()->after('endereco_numero');
            $table->string('endereco_cidade', 120)->nullable()->after('endereco_complemento');
            $table->string('endereco_estado', 80)->nullable()->after('endereco_cidade');
            $table->string('endereco_cep', 20)->nullable()->after('endereco_estado');
            $table->string('pais_atual', 100)->nullable()->after('endereco_cep');
        });
    }

    public function down(): void
    {
        Schema::table('tecnicos', function (Blueprint $table): void {
            $table->dropColumn([
                'telefone_secundario',
                'data_nascimento',
                'nacionalidade_secundaria',
                'cpf',
                'cnpj',
                'nome_fantasia_empresa',
                'razao_social_empresa',
                'endereco_rua',
                'endereco_numero',
                'endereco_complemento',
                'endereco_cidade',
                'endereco_estado',
                'endereco_cep',
                'pais_atual',
            ]);
        });
    }
};
