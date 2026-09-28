<?php

namespace App\Support;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoStatusEnum;

/** Mapeamento explícito e testável entre os ciclos de vida do serviço e da perícia. */
final class ServicoPericiaStatusMap
{
    public static function daSituacaoServico(ServicoStatusEnum $status): PericiaStatusEnum
    {
        return match ($status) {
            ServicoStatusEnum::EM_EXECUCAO, ServicoStatusEnum::RETRABALHO => PericiaStatusEnum::EM_EXECUCAO,
            ServicoStatusEnum::CONCLUIDO, ServicoStatusEnum::FINALIZADO => PericiaStatusEnum::CONCLUIDA,
            ServicoStatusEnum::CANCELADO => PericiaStatusEnum::CANCELADA,
            default => PericiaStatusEnum::ABERTA,
        };
    }

    /**
     * Evita finalizar o serviço caso uma de suas perícias continue aberta ou em execução.
     * Não regride um serviço já aceito quando outra perícia nova ainda está aberta.
     */
    public static function daSituacaoPericias(ServicoStatusEnum $atual, array $statuses): ?ServicoStatusEnum
    {
        if (! $statuses) return null;
        $values = array_map(fn ($value) => $value instanceof PericiaStatusEnum ? $value->value : $value, $statuses);
        if (count(array_filter($values, fn ($s) => $s === PericiaStatusEnum::CANCELADA->value)) === count($values)) {
            return ServicoStatusEnum::CANCELADO;
        }
        if (count(array_filter($values, fn ($s) => $s === PericiaStatusEnum::CONCLUIDA->value)) === count($values)) {
            return in_array($atual, [ServicoStatusEnum::CONCLUIDO, ServicoStatusEnum::FINALIZADO], true)
                ? $atual : ServicoStatusEnum::FINALIZADO;
        }
        if (in_array(PericiaStatusEnum::EM_EXECUCAO->value, $values, true)) {
            return $atual === ServicoStatusEnum::RETRABALHO ? $atual : ServicoStatusEnum::EM_EXECUCAO;
        }
        return null;
    }
}
