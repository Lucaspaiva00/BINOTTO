<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicoVeiculo extends Model
{
    use HasFactory;

    protected $table = 'servico_veiculos';

    protected $fillable = [
        'servico_id',
        'placa',
        'chassi',
        'marca_modelo',
        'reparos_execucao',
        'preco_total',
        'finalizado_em',
    ];

    protected $casts = [
        'preco_total' => 'decimal:2',
        'reparos_execucao' => 'array',
        'finalizado_em' => 'datetime',
    ];

    // Relacionamentos
    public function servico()
    {
        return $this->belongsTo(Servico::class);
    }
}