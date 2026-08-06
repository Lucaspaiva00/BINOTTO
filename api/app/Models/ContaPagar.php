<?php

namespace App\Models;

use App\Enums\FinanceiroStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContaPagar extends Model
{
    use HasFactory;

    protected $table = 'contas_pagar';

    protected $fillable = [
        'servico_id',
        'origem',
        'oficina_id',
        'tecnico_id',
        'descricao',
        'fornecedor',
        'categoria',
        'forma_pagamento',
        'valor_a_pagar',
        'valor_pago',
        'data_emissao',
        'data_pagamento',
        'observacoes',
        'data_lancamento',
        'data_vencimento',
        'status',
    ];

    protected $casts = [
        'valor_a_pagar' => 'decimal:2',
        'valor_pago' => 'decimal:2',
        'data_emissao' => 'date',
        'data_pagamento' => 'date',
        'data_lancamento' => 'date',
        'data_vencimento' => 'date',
        'status' => FinanceiroStatusEnum::class,
    ];

    public function servico(): BelongsTo
    {
        return $this->belongsTo(Servico::class);
    }

    public function oficina(): BelongsTo
    {
        return $this->belongsTo(Oficina::class);
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(Tecnico::class);
    }
}
