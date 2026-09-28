<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ServicoVeiculo extends Model
{
    use HasFactory;

    protected $table = 'servico_veiculos';

    protected $fillable = [
        'servico_id',
        'placa',
        'chassi',
        'marca_modelo',
        'marca',
        'modelo',
        'fotos_veiculo',
        'reparos_execucao',
        'preco_total',
        'finalizado_em',
    ];

    protected $casts = [
        'preco_total' => 'decimal:2',
        'reparos_execucao' => 'array',
        'fotos_veiculo' => 'array',
        'finalizado_em' => 'datetime',
    ];

    // Campos adicionais para o APP; os caminhos antigos continuam intactos.
    protected $appends = ['fotos_veiculo_urls', 'reparos_execucao_urls'];

    public function getFotosVeiculoUrlsAttribute(): array
    {
        return collect($this->fotos_veiculo ?? [])->map(fn ($path) => Storage::disk('public')->url($path))->all();
    }

    public function getReparosExecucaoUrlsAttribute(): array
    {
        return collect($this->reparos_execucao ?? [])->map(function ($part) {
            $part['fotos'] = collect($part['fotos'] ?? [])->map(fn ($path) => Storage::disk('public')->url($path))->all();
            return $part;
        })->all();
    }

    // Relacionamentos
    public function servico()
    {
        return $this->belongsTo(Servico::class);
    }
}