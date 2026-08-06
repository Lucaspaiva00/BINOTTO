<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Oficina;
use App\Models\Tecnico;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ADMIN
        $admin = User::create([
            'email' => 'admin@email.com',
            'nome' => 'admin',
            'senha' => Hash::make('123456'),
            'whatsapp' => '+5584900000001',
            'perfil' => 'ADMIN',
            'ativo' => true,
        ]);

        // USUÁRIO OFICINA
        $userOficina = User::create([
            'email' => 'oficina@email.com',
            'senha' => Hash::make('123456'),
            'codigo_pais_telefone' => '55',
            'numero_telefone' => '84900000002',
            'whatsapp' => '+5584900000002',
            'perfil' => 'OFICINA',
            'ativo' => true,
        ]);

        Oficina::create([
            'nome_fantasia' => 'Oficina Exemplo',
            'nome_responsavel' => 'João da Silva',
            'usuario_id' => $userOficina->id,
            'numero' => "123",
            'rua' => "Rua exemplo",
            'cidade' => "Veneza",
            'cep' => "591235",
            'estado' => "Veneza",
            'pais' => "Itália",
        ]);

        // USUÁRIO TÉCNICO
        $userTecnico = User::create([
            'email' => 'tecnico@email.com',
            'senha' => Hash::make('123456'),
            'codigo_pais_telefone' => '55',
            'numero_telefone' => '84900000003',
            'whatsapp' => '+5584900000003',
            'perfil' => 'TECNICO',
            'ativo' => true,
        ]);

        Tecnico::create([
            'nome_completo' => 'Carlos Técnico',
            'apelido' => 'Carlão',
            'usuario_id' => $userTecnico->id,
        ]);
    }
}