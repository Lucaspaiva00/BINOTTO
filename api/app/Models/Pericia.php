<?php

namespace App\Models;

use App\Enums\PericiaStatusEnum;
use App\Support\ServicoPrecos;
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
        'marca',
        'modelo',
        'perito_nome',
        'valor_desmontagem',
        'valor_total',
        'valor_sugerido_tecnico',
        'coeficiente_aplicado',
        'visibilidade_valores',
        'tipo',
        'status',
        'prazo',
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
        'prazo' => 'date',
        'preco_sugerido' => 'decimal:2',
        'valor_pericia' => 'decimal:2',
        'valor_desmontagem' => 'decimal:2',
        'valor_total' => 'decimal:2',
        'valor_sugerido_tecnico' => 'decimal:2',
        'coeficiente_aplicado' => 'decimal:2',
        'visibilidade_valores' => 'array',
        'concluida_em' => 'datetime',
        'status' => PericiaStatusEnum::class,
    ];

    protected $appends = [
        'esta_concluida',
        'numero_publico',
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

    /**
     * Mantém compatibilidade com perícias antigas (sem flags) e aplica as flags
     * das novas perícias ao serializar respostas para o técnico, inclusive
     * quando o registro está aninhado em respostas de serviços.
     */
    public function toArray(): array
    {
        $data = parent::toArray();
        $user = auth()->user();
        $visibility = $this->visibilidade_valores;
        $perfil = $user?->perfil;
        if ($perfil === 'TECNICO' && is_array($visibility)) {
            if (! ($visibility['carro'] ?? false)) $data['valor_pericia'] = null;
            if (! ($visibility['desmontagem'] ?? false)) $data['valor_desmontagem'] = null;
            if (! ($visibility['total'] ?? false)) $data['valor_total'] = null;
            if (! ($visibility['sugerido'] ?? false)) {
                $data['preco_sugerido'] = null;
                $data['valor_sugerido_tecnico'] = null;
            }
        }
        // A perícia vinculada também é acessível pelo endpoint próprio do APP;
        // aplica a mesma ocultação aprovada no serviço, sem afetar perícias legadas.
        if ($this->servico_id && in_array($perfil, ServicoPrecos::PERFIS, true)) {
            $linked = $this->relationLoaded('servico')
                ? $this->getRelation('servico')
                : $this->servico()->first(['id', 'precos_detalhados']);
            if (is_array($linked?->precos_detalhados)) {
                $visible = ServicoPrecos::paraPerfil($linked->precos_detalhados, $perfil);
                $own = $perfil === 'TECNICO' ? 'tecnico' : 'oficina';
                if (($visible['oficina_carro'] ?? null) === null && $perfil === 'TECNICO') {
                    $data['valor_pericia'] = null;
                    $data['valor_total'] = null;
                }
                if (($visible['oficina_desmontagem'] ?? null) === null && $perfil === 'TECNICO') {
                    $data['valor_desmontagem'] = null;
                }
                if (($visible['tecnico_carro'] ?? null) === null && $perfil === 'OFICINA') {
                    $data['valor_sugerido_tecnico'] = null;
                    $data['preco_sugerido'] = null;
                }
                if ($perfil === 'TECNICO' && ($visible['tecnico_carro'] ?? null) === null) {
                    $data['preco_sugerido'] = null;
                    $data['valor_sugerido_tecnico'] = null;
                }
                if ($perfil === 'OFICINA' && ($visible['oficina_carro'] ?? null) === null) {
                    $data['valor_pericia'] = null;
                    $data['valor_total'] = null;
                }
                if ($perfil === 'OFICINA' && ($visible['oficina_desmontagem'] ?? null) === null) {
                    $data['valor_desmontagem'] = null;
                }
            }
        }
        return $data;
    }

    /** Referência legível para operação e cliente. */
    public function getNumeroPublicoAttribute(): string
    {
        $data = $this->created_at ?? now();

        return sprintf('PER-%s-%06d', $data->format('Ym'), $this->id);
    }
}
