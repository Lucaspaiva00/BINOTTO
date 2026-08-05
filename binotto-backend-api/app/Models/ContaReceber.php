<?php

namespace App\Models;

use App\Enums\FinanceiroStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContaReceber extends Model
{
    use HasFactory;

    protected $table = 'contas_receber';

    protected $fillable = [
        'tecnico_id',
        'oficina_id',
        'servico_id',
        'origem',
        'descricao',
        'valor_servico',
        'valor_plataforma',
        'quem_pagou',
        'cliente',
        'categoria',
        'forma_pagamento',
        'data_emissao',
        'data_recebimento',
        'observacoes',
        'data_lancamento',
        'data_vencimento',
        'status',
    ];

    protected $casts = [
        'valor_servico' => 'decimal:2',
        'valor_plataforma' => 'decimal:2',
        'data_emissao' => 'date',
        'data_recebimento' => 'date',
        'data_lancamento' => 'date',
        'data_vencimento' => 'date',
        'status' => FinanceiroStatusEnum::class,
    ];

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(Tecnico::class);
    }

    public function oficina(): BelongsTo
    {
        return $this->belongsTo(Oficina::class);
    }

    public function servico(): BelongsTo
    {
        return $this->belongsTo(Servico::class);
    }
}
