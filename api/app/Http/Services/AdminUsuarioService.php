<?php

namespace App\Http\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminUsuarioService
{
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
