<?php

namespace App\Http\Services;

use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUsuarioService
{
    public function create(array $data): User
    {
        $whatsapp = $data['codigo_pais_telefone'] . $data['numero_telefone'];
        $email = strtolower($data['email']);

        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => [__('main.user_email_already_registered')],
            ]);
        }

        if (User::where('whatsapp', $whatsapp)->exists()) {
            throw ValidationException::withMessages([
                'numero_telefone' => [__('main.user_whatsapp_already_registered')],
            ]);
        }

        return DB::transaction(function () use ($data, $whatsapp, $email) {
            $user = User::create([
                'email' => $email,
                'codigo_pais_telefone' => $data['codigo_pais_telefone'],
                'numero_telefone' => $data['numero_telefone'],
                'iso_pais_telefone' => $data['iso_pais_telefone'],
                'whatsapp' => $whatsapp,
                'senha' => Hash::make($data['senha']),
                'perfil' => $data['perfil'],
                'ativo' => true,
            ]);

            if ($data['perfil'] === 'TECNICO') {
                Tecnico::create([
                    'nome_completo' => $data['nome_completo'],
                    'apelido' => $data['apelido'] ?? null,
                    'usuario_id' => $user->id,
                ]);
            } else {
                Oficina::create([
                    'nome_fantasia' => $data['nome_fantasia'],
                    'nome_responsavel' => $data['nome_responsavel'],
                    'usuario_id' => $user->id,
                ]);
            }

            return $user->fresh(['oficina', 'tecnico']);
        });
    }

    public function updatePassword(User $usuario, string $senha): void
    {
        $usuario->update([
            'senha' => Hash::make($senha),
        ]);
    }

    public function toggleStatus(User $usuario, User $admin, ?string $senha): void
    {
        if (!$usuario->ativo) {
            if (!$senha || !Hash::check($senha, $admin->senha)) {
                throw ValidationException::withMessages([
                    'senha' => [__('main.admin_password_invalid')],
                ]);
            }
        }

        $usuario->update(['ativo' => !$usuario->ativo]);
    }

    public function deleteWithAdminPassword(User $usuario, User $admin, string $senha): void
    {
        if (!Hash::check($senha, $admin->senha)) {
            throw ValidationException::withMessages([
                'senha' => [__('main.admin_password_invalid')],
            ]);
        }

        DB::transaction(function () use ($usuario) {
            $usuario->ativo = false;
            $usuario->save();
            $usuario->delete();
        });
    }
}
