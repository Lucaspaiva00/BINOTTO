<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'profile' => $this->perfil,
            'name' => $this->nomePerfil(),
            'document' => $this->documentoPerfil(),
            'email' => $this->email,
            'phoneCountryCode' => $this->codigo_pais_telefone,
            'phoneCountryIso' => $this->iso_pais_telefone,
            'phoneNumber' => $this->numero_telefone,
            'secondaryPhoneCountryCode' => $this->perfilRelacionado()?->codigo_pais_telefone_secundario,
            'secondaryPhoneCountryIso' => $this->perfilRelacionado()?->iso_pais_telefone_secundario,
            'secondaryPhoneNumber' => $this->perfilRelacionado()?->telefone_secundario,
            'city' => $this->cidadePerfil(),
            'country' => $this->paisPerfil(),
            'paymentTerm' => $this->perfil === 'OFICINA' ? $this->oficina?->prazo_pagamento : null,
            'status' => $this->ativo ? 'ativo' : 'desativado',
            'createdAt' => $this->created_at,
        ];
    }

    private function perfilRelacionado()
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico,
            'OFICINA' => $this->oficina,
            default => null,
        };
    }

    private function nomePerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->nome_completo,
            'OFICINA' => $this->oficina?->razao_social
                ?: $this->oficina?->nome_fantasia,
            default => $this->nome,
        };
    }

    private function documentoPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->cpf,
            'OFICINA' => $this->oficina?->cnpj,
            default => null,
        };
    }

    private function cidadePerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_cidade,
            'OFICINA' => $this->oficina?->cidade,
            default => null,
        };
    }

    private function paisPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->pais_atual,
            'OFICINA' => $this->oficina?->pais,
            default => null,
        };
    }
}
