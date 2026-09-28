<?php

namespace App\Observers;

use App\Enums\PericiaStatusEnum;
use App\Models\Pericia;
use App\Models\Servico;
use App\Support\ServicoPericiaStatusMap;

/** Sincroniza alterações feitas na perícia, preservando serviços com múltiplas perícias. */
class PericiaStatusObserver
{
    public function saved(Pericia $pericia): void
    {
        if (! $pericia->servico_id || (! $pericia->wasChanged('status') && ! $pericia->wasChanged('servico_id'))) {
            return;
        }
        $servico = Servico::find($pericia->servico_id);
        if (! $servico) {
            return;
        }

        $statuses = $servico->pericias()->pluck('status')->map(fn ($v) => $v instanceof PericiaStatusEnum ? $v->value : $v)->all();
        if (! count($statuses)) {
            return;
        }
        $target = ServicoPericiaStatusMap::daSituacaoPericias($servico->status, $statuses);
        if ($target === null) return;
        if ($servico->status !== $target) {
            // Suprime apenas a propagação de volta para este mesmo evento.
            Servico::withoutEvents(fn () => $servico->update(['status' => $target]));
        }
    }
}
