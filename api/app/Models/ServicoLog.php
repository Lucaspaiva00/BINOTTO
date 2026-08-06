<?php

namespace App\Models;

use App\Enums\ServicoLogTipoEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicoLog extends Model
{
    use HasFactory;

    protected $table = 'servico_logs';

    protected $fillable = [
        'servico_id',
        'pericia_id',
        'tecnico_id',
        'oficina_id',
        'tipo',
        'motivo',
        'descricao',
        'payload',
    ];

    protected $casts = [
        'tipo' => ServicoLogTipoEnum::class,
        'payload' => 'array',
    ];


    // RELACIONAMENTOS
    public function servico()
    {
        return $this->belongsTo(Servico::class);
    }

    public function pericia()
    {
        return $this->belongsTo(Pericia::class);
    }

    public function tecnico()
    {
        return $this->belongsTo(Tecnico::class);
    }

    public function oficina()
    {
        return $this->belongsTo(Oficina::class);
    }

    // HELPERS
    public function isTipo(ServicoLogTipoEnum $tipo): bool
    {
        return $this->tipo === $tipo;
    }

    public function scopeTipo($query, ServicoLogTipoEnum $tipo)
    {
        return $query->where('tipo', $tipo->value);
    }

    public function scopeRecentes($query)
    {
        return $query->orderByDesc('created_at');
    }
}