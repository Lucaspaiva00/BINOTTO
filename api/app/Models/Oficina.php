<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Oficina extends Model
{
    protected $table = 'oficinas';

    protected $fillable = [
        'nome_fantasia',
        'nome_responsavel',
        'usuario_id',
        'tecnicos_preferidos',
        'tecnicos_bloqueados',
        'cnpj',
        'razao_social',
        'email_secundario',
        'telefone_secundario',
        'codigo_pais_telefone_secundario',
        'iso_pais_telefone_secundario',
        'numero',
        'rua',
        'complemento',
        'cidade',
        'cep',
        'estado',
        'pais',
        'prazo_pagamento',
    ];

    protected $casts = [
        'tecnicos_preferidos' => 'array',
        'tecnicos_bloqueados' => 'array',
    ];

    protected $appends = [
        'endereco_display',
    ];

    // a oficina pertence a um usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function documentos()
    {
        return $this->hasMany(OficinaDocumento::class);
    }

    // utils
    public function podeSolicitarTecnico(): bool
    {
        return collect([
            $this->rua,
            $this->numero,
            $this->cidade,
            $this->cep,
            $this->estado,
            $this->pais,
        ])->every(fn ($field) => filled($field));
    }

    public function getEnderecoDisplayAttribute(): array
    {
        return [
            'titulo' => $this->cidade,
            'subtitulo' => trim(implode(', ', array_filter([
                trim($this->rua.' '.$this->numero),
                trim($this->cep.' '.$this->cidade),
                $this->pais ?? 'Brasil',
            ]))),
        ];
    }
}
