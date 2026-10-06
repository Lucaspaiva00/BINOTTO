<?php

namespace App\Observers;

use App\Enums\PericiaStatusEnum;
use App\Models\Servico;
use App\Support\ServicoPericiaStatusMap;
use App\Support\ServicoFinanceiro;

/** Atualização do serviço é a fonte de verdade para status das perícias vinculadas. */
class ServicoStatusObserver
{
    public function saved(Servico $servico): void
    {
        if (! $servico->wasChanged('status')) {
            return;
        }

        $new = ServicoPericiaStatusMap::daSituacaoServico($servico->status);

        // Uma atualização SQL em lote evita recursão com PericiaStatusObserver.
        // Só reabre perícias concluídas/canceladas em transições explícitas de reabertura.
        $query = $servico->pericias()->where('status', '!=', $new->value);
        if ($new === PericiaStatusEnum::CONCLUIDA) {
            // Uma perícia cancelada não é executada/concluída por acidente.
            $query->where('status', '!=', PericiaStatusEnum::CANCELADA->value);
        }
        $query->update([
            'status' => $new->value,
            'concluida_em' => $new === PericiaStatusEnum::CONCLUIDA ? now() : null,
        ]);
        ServicoFinanceiro::sincronizarFinalizado($servico);
    }
}
