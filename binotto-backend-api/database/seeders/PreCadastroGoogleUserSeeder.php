<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Seeder apenas para teste de login social
class PreCadastroGoogleUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('usuarios')->insert([
            'email' => 'teste.google@demo.com',
            'senha' => null,
            'whatsapp' => null,
            'perfil' => 'TECNICO',
            'ativo' => false,
            'google_id' => 'google_123456789_test',
            'apple_id' => 'apple_987654321_test',
            'facebook_id' => 'facebook_555666777_test',
            'cod_recuperacao' => null,
            'cod_expira_em' => null,
            'cod_usado_em' => null,
            'cod_canal' => null,
            'idioma' => 'pt-BR',
        ]);
    }
}
