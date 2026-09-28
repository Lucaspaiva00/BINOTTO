<?php

namespace App\Models;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoStatusEnum;
use App\Support\ServicoPrecos;
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
        'precos_detalhados',
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
        'percentual_tecnico',
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
        'precos_detalhados' => 'array',
        'ids_tecnico_recusa' => 'array',
        'status' => ServicoStatusEnum::class,
        'preco_tecnico' => 'decimal:2',
        'percentual_tecnico' => 'decimal:2',
        'tecnicos_preferidos_notificados' => 'array',
        'disponivel_para_todos' => 'boolean',
    ];

    protected $appends = [
        'status_label_oficina',
        'status_label_tecnico',
        'placa',
        'modelo',
    ];

    public function toArray(): array
    {
        $data = parent::toArray();
        $user = auth()->user();
        $perfil = $user?->perfil;
        if (! is_array($this->precos_detalhados) || ! in_array($perfil, ServicoPrecos::PERFIS, true)) {
            return $data; // Serviços antigos continuam funcionando com o contrato legado.
        }

        $visible = ServicoPrecos::paraPerfil($this->precos_detalhados, $perfil);
        $data['precos_detalhados'] = $visible;
        $data['precos_calculados'] = ServicoPrecos::calculadosParaPerfil($this->precos_detalhados, $perfil);

        $own = $perfil === 'TECNICO' ? 'tecnico' : 'oficina';
        $other = $perfil === 'TECNICO' ? 'oficina' : 'tecnico';
        if (($visible["{$other}_carro"] ?? null) === null) {
            if ($perfil === 'TECNICO') {
                $data['valor_total'] = null;
                foreach (['primeiro_veiculo', 'veiculos'] as $relation) {
                    if (isset($data[$relation]) && is_array($data[$relation])) {
                        if ($relation === 'primeiro_veiculo') {
                            $data[$relation]['preco_total'] = null;
                        } else {
                            foreach ($data[$relation] as &$vehicle) {
                                if (is_array($vehicle)) $vehicle['preco_total'] = null;
                            }
                            unset($vehicle);
                        }
                    }
                }
            } else {
                $data['preco_tecnico'] = null;
                $data['percentual_tecnico'] = null;
            }
        }

        // Desabilitar o próprio campo também precisa valer nos aliases legados.
        if ($perfil === 'TECNICO' && ($visible['tecnico_carro'] ?? null) === null) {
            $data['preco_tecnico'] = null;
            $data['percentual_tecnico'] = null;
        }
        if ($perfil === 'OFICINA' && ($visible['oficina_carro'] ?? null) === null) {
            $data['valor_total'] = null;
            if (isset($data['primeiro_veiculo']) && is_array($data['primeiro_veiculo'])) {
                $data['primeiro_veiculo']['preco_total'] = null;
            }
            if (isset($data['veiculos']) && is_array($data['veiculos'])) {
                foreach ($data['veiculos'] as &$vehicle) {
                    if (is_array($vehicle)) $vehicle['preco_total'] = null;
                }
                unset($vehicle);
            }
        }

        // Os detalhes financeiros da perícia vinculada não podem contornar
        // a regra de ocultação do serviço nas respostas mobile.
        foreach (['pericia', 'pericias', 'pericia_em_execucao', 'pericia_aberta_vinculada', 'ultima_pericia'] as $key) {
            if (! isset($data[$key])) continue;
            $isList = $key === 'pericias';
            $items = $isList ? $data[$key] : [$data[$key]];
            if (! is_array($items)) continue;
            foreach ($items as &$inspection) {
                if (! is_array($inspection)) continue;
                if ($perfil === 'TECNICO' && ($visible['oficina_carro'] ?? null) === null) {
                    foreach (['valor_pericia', 'valor_total', 'valor_desmontagem'] as $field) $inspection[$field] = null;
                }
                if ($perfil === 'OFICINA' && ($visible['tecnico_carro'] ?? null) === null) {
                    foreach (['valor_sugerido_tecnico', 'preco_sugerido'] as $field) $inspection[$field] = null;
                }
            }
            unset($inspection);
            $data[$key] = $isList ? $items : ($items[0] ?? null);
        }
        return $data;
    }

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
