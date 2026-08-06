<?php

namespace App\Http\Services;

use App\Models\User;

class ProfileCompletionService
{
    public function percentFor(User $user): ?int
    {
        return match ($user->perfil) {
            'OFICINA' => $this->oficinaPercent($user),
            'TECNICO' => $this->tecnicoPercent($user),
            default => null,
        };
    }

    private function oficinaPercent(User $user): ?int
    {
        $oficina = $user->oficina;

        if (!$oficina) {
            return 0;
        }

        return $this->filledPercent([
            $oficina->nome_fantasia,
            $oficina->razao_social,
            $oficina->nome_responsavel,
            $user->email,
            $user->codigo_pais_telefone,
            $user->numero_telefone,
            $oficina->codigo_pais_telefone_secundario,
            $oficina->telefone_secundario,
            $oficina->cnpj,
            $oficina->rua,
            $oficina->numero,
            $oficina->cidade,
            $oficina->estado,
            $oficina->cep,
            $oficina->pais,
            $oficina->prazo_pagamento,
        ]);
    }

    private function tecnicoPercent(User $user): ?int
    {
        $tecnico = $user->tecnico;

        if (!$tecnico) {
            return 0;
        }

        return $this->filledPercent([
            $tecnico->nome_completo,
            $user->email,
            $user->codigo_pais_telefone,
            $user->numero_telefone,
            $tecnico->cpf,
            $tecnico->endereco_rua,
            $tecnico->endereco_numero,
            $tecnico->endereco_cidade,
            $tecnico->endereco_estado,
            $tecnico->endereco_cep,
            $tecnico->pais_atual,
        ]);
    }

    private function filledPercent(array $values): int
    {
        $total = count($values);

        if ($total === 0) {
            return 0;
        }

        $filled = collect($values)
            ->filter(fn ($value) => filled(is_string($value) ? trim($value) : $value))
            ->count();

        return (int) round(($filled / $total) * 100);
    }
}
