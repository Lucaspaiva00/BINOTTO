<?php

namespace App\Http\Resources\Api\Admin;

use App\Http\Services\ProfileCompletionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $perfil = $this->perfilRelacionado();

        return [
            'id' => $this->id,
            'profile' => $this->perfil,
            'name' => $this->nomePerfil(),
            'responsible' => $this->responsavelPerfil(),
            'document' => $this->documentoPerfil(),
            'email' => $this->email,
            'phoneCountryCode' => $this->codigo_pais_telefone,
            'phoneCountryIso' => $this->iso_pais_telefone,
            'phoneNumber' => $this->numero_telefone,
            'secondaryPhoneCountryCode' => $perfil?->codigo_pais_telefone_secundario,
            'secondaryPhoneCountryIso' => $perfil?->iso_pais_telefone_secundario,
            'secondaryPhoneNumber' => $perfil?->telefone_secundario,
            'secondaryEmail' => $this->perfil === 'OFICINA' ? $this->oficina?->email_secundario : null,
            'tradeName' => $this->perfil === 'OFICINA' ? $this->oficina?->nome_fantasia : null,
            'companyName' => $this->perfil === 'OFICINA' ? $this->oficina?->razao_social : null,
            'street' => $this->ruaPerfil(),
            'number' => $this->numeroPerfil(),
            'complement' => $this->complementoPerfil(),
            'city' => $this->cidadePerfil(),
            'state' => $this->estadoPerfil(),
            'zip' => $this->cepPerfil(),
            'country' => $this->paisPerfil(),
            'paymentTerm' => $this->perfil === 'OFICINA' ? $this->oficina?->prazo_pagamento : null,
            'profileCompletionPercent' => app(ProfileCompletionService::class)->percentFor($this->resource),
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
            'OFICINA' => $this->oficina?->nome_fantasia
                ?: $this->oficina?->razao_social,
            default => $this->nome,
        };
    }

    private function responsavelPerfil(): ?string
    {
        return match ($this->perfil) {
            'OFICINA' => $this->oficina?->nome_responsavel,
            'TECNICO' => $this->tecnico?->nome_completo,
            default => null,
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

    private function ruaPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_rua,
            'OFICINA' => $this->oficina?->rua,
            default => null,
        };
    }

    private function numeroPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_numero,
            'OFICINA' => $this->oficina?->numero,
            default => null,
        };
    }

    private function complementoPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_complemento,
            'OFICINA' => $this->oficina?->complemento,
            default => null,
        };
    }

    private function estadoPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_estado,
            'OFICINA' => $this->oficina?->estado,
            default => null,
        };
    }

    private function cepPerfil(): ?string
    {
        return match ($this->perfil) {
            'TECNICO' => $this->tecnico?->endereco_cep,
            'OFICINA' => $this->oficina?->cep,
            default => null,
        };
    }
}
