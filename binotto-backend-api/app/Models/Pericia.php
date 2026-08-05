<?php

namespace App\Models;

use App\Enums\PericiaStatusEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pericia extends Model
{
    use HasFactory;

    protected $table = 'pericias';

    protected $fillable = [
        'tecnico_id',
        'oficina_id',
        'servico_id',
        'placa',
        'chassi',
        'marca_modelo',
        'tipo',
        'status',
        'reparos_necessarios',
        'fotos_pericia_completa',
        'fotos',
        'moeda',
        'preco_sugerido',
        'valor_pericia',
        'concluida_em',
    ];

    protected $casts = [
        'reparos_necessarios' => 'array',
        'fotos_pericia_completa' => 'array',
        'fotos' => 'array',
        'preco_sugerido' => 'decimal:2',
        'valor_pericia' => 'decimal:2',
        'concluida_em' => 'datetime',
        'status' => PericiaStatusEnum::class,
    ];

    protected $appends = [
        'esta_concluida',
    ];

    public function oficina(): BelongsTo
    {
        return $this->belongsTo(Oficina::class);
    }

    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(Tecnico::class);
    }

    public function servico(): BelongsTo
    {
        return $this->belongsTo(Servico::class);
    }

    public function getEstaConcluidaAttribute(): bool
    {
        return !is_null($this->concluida_em);
    }
}