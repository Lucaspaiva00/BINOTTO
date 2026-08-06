<?php

namespace App\Models;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoStatusEnum;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Servico extends Model
{
    use HasFactory;

    protected $table = 'servicos';

    protected $fillable = [
        'oficina_id',
        'tecnico_id',
        'criado_por_usuario_id',
        'data_inicio',
        'data_fim',
        'quantidade_tipo',
        'quantidade',
        'moeda',
        'valor_total',
        'pericia_completa',
        'status',
        'tecnico_label',
        'oficina_label',
        'avaliacao',
        'data_prevista_chegada',
        'horario_previsto_chegada',
        'aceito_em',
        'observacoes',
        'preco_tecnico',
        'tecnicos_preferidos_notificados',
        'disponivel_para_todos', 
        'liberado_para_todos_em',
        'ids_tecnico_recusa'
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
        'data_prevista_chegada' => 'date',
        'valor_total' => 'decimal:2',
        'ids_tecnico_recusa' => 'array',
        'status' => ServicoStatusEnum::class,
        'preco_tecnico' => 'decimal:2',
        'tecnicos_preferidos_notificados' => 'array',
        'disponivel_para_todos' => 'boolean',
    ];

    protected $appends = [
        'status_label_oficina',
        'status_label_tecnico',
        'placa',
        'modelo',
    ];

    // Relacionamentos
    public function oficina()
    {
        return $this->belongsTo(Oficina::class);
    }

    public function tecnico()
    {
        return $this->belongsTo(Tecnico::class);
    }

    public function criadoPor()
    {
        return $this->belongsTo(User::class, 'criado_por_usuario_id');
    }

    public function pericias()
    {
        return $this->hasMany(Pericia::class);
    }

    public function ultimaPericia()
    {
        return $this->hasOne(Pericia::class)->latestOfMany();
    }

    public function periciaEmExecucao()
    {
        return $this->hasOne(Pericia::class)
            ->where('status', PericiaStatusEnum::EM_EXECUCAO)
            ->latest();
    }

    public function periciaAbertaVinculada()
    {
        return $this->hasOne(Pericia::class)
            ->where('status', PericiaStatusEnum::ABERTA)
            ->latestOfMany();
    }

    public function recusas()
    {
        return $this->hasMany(ServicoRecusado::class);
    }

    public function veiculos()
    {
        return $this->hasMany(ServicoVeiculo::class);
    }

    public function primeiroVeiculo()
    {
        return $this->hasOne(ServicoVeiculo::class)->latestOfMany();
    }

    public function logs()
    {
        return $this->hasMany(ServicoLog::class)
            ->orderByDesc('created_at');
    }

    // scopes
    public function scopeVisiveisParaTecnico(Builder $query, int $tecnicoId)
    {
        return $query
            ->where(function ($q) use ($tecnicoId) {
                $q->where('tecnico_id', $tecnicoId)
                ->orWhereIn('status', [
                    ServicoStatusEnum::AGUARDANDO->value,
                    ServicoStatusEnum::AGUARDANDO_APROVACAO->value,
                ])

                ->orWhere(function ($sub) {
                    $sub->where('status', ServicoStatusEnum::EM_BREVE->value)
                        ->where('disponivel_para_todos', true);
                })
                
                ->orWhere(function ($sub) use ($tecnicoId) {
                    $sub->where('status', ServicoStatusEnum::EM_BREVE->value)
                        ->whereJsonContains('tecnicos_preferidos_notificados', $tecnicoId);
                });
            });
    }

    // utils
    // avalia se ta disponivel para o tecnico aceitar
    public function isAvailableFor(Tecnico $tecnico): bool 
    {
        // ja foi aceito por outro tecnico
        if ($this->tecnico_id && $this->tecnico_id !== $tecnico->id) {
            return false;
        }

        if ($this->status === ServicoStatusEnum::AGUARDANDO) {
            return true;
        }

        if ($this->status !== ServicoStatusEnum::EM_BREVE) {
            return false;
        }

        if ($this->disponivel_para_todos) {
            return true;
        }

        return collect($this->tecnicos_preferidos_notificados ?? [])->contains($tecnico->id);
    }

    public function getStatusLabelOficinaAttribute(): string
    {
        return $this->status->oficinaLabel();
    }

    public function getStatusLabelTecnicoAttribute(): string
    {
        return $this->status->tecnicoLabel();
    }

    public function getPlacaAttribute(): ?string
    {
        return $this->primeiroVeiculo?->placa;
    }

    public function getModeloAttribute(): ?string
    {
        return $this->primeiroVeiculo?->modelo;
    }
}
