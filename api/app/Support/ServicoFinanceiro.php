<?php

namespace App\Support;

use App\Enums\FinanceiroStatusEnum;
use App\Enums\ServicoStatusEnum;
use App\Models\ContaPagar;
use App\Models\ContaReceber;
use App\Models\Servico;
use Illuminate\Support\Facades\DB;

/**
 * Mantém os lançamentos financeiros originados por um serviço finalizado.
 * É idempotente: editar um serviço já finalizado atualiza os mesmos lançamentos.
 */
final class ServicoFinanceiro
{
    /** Outros fluxos de conclusão usam os preços já persistidos no serviço. */
    public static function sincronizarFinalizado(Servico $servico): void
    {
        if (! in_array($servico->status, [ServicoStatusEnum::FINALIZADO, ServicoStatusEnum::CONCLUIDO], true)) return;
        DB::transaction(function () use ($servico) {
            // Serializa as conclusões simultâneas do mesmo serviço, sem duplicar contas.
            $atual = Servico::whereKey($servico->id)->lockForUpdate()->firstOrFail();
            if (! in_array($atual->status, [ServicoStatusEnum::FINALIZADO, ServicoStatusEnum::CONCLUIDO], true)) return;

            $precos = $atual->precos_detalhados ?? [
                'oficina_carro' => ['tipo' => 'valor', 'valor' => (float) ($atual->valor_total ?? 0)],
                'oficina_desmontagem' => ['tipo' => 'valor', 'valor' => 0],
                'tecnico_carro' => [
                    'tipo' => $atual->percentual_tecnico !== null ? 'porcentagem' : 'valor',
                    'valor' => (float) ($atual->percentual_tecnico ?? $atual->preco_tecnico ?? 0),
                ],
                'tecnico_desmontagem' => ['tipo' => 'valor', 'valor' => 0],
            ];
            self::sincronizar($atual, $precos, ServicoPrecos::calcularSeguro($precos));
        });
    }

    public static function sincronizar(Servico $servico, array $precos, array $calculados): void
    {
        $servico->loadMissing(['oficina', 'tecnico', 'primeiroVeiculo']);
        $totais = ServicoPrecos::somarCalculados($calculados);
        $veiculo = $servico->primeiroVeiculo;
        $data = ($servico->data_servico ?? $servico->data_inicio ?? $servico->created_at ?? now())->format('Y-m-d');
        $referenciaTipo = $veiculo?->placa ? 'placa' : ($veiculo?->chassi ? 'chassi' : null);
        $descricaoVeiculo = trim(implode(' ', array_filter([$veiculo?->marca, $veiculo?->modelo])));
        $referencia = $referenciaTipo === 'placa' ? $veiculo?->placa : $veiculo?->chassi;
        $descricao = 'Serviço #'.$servico->id;
        if ($descricaoVeiculo !== '') $descricao .= ' - '.$descricaoVeiculo;
        if ($referencia) $descricao .= ' - '.$referencia;

        $receber = ContaReceber::firstOrNew([
            'servico_id' => $servico->id,
            'origem' => 'aplicativo',
        ]);
        $receber->fill([
            'tecnico_id' => $servico->tecnico_id,
            'oficina_id' => $servico->oficina_id,
            'referencia_veiculo_tipo' => $receber->referencia_veiculo_tipo ?: $referenciaTipo,
            'descricao' => $descricao,
            'valor_servico' => $totais['oficina'] ?? (float) ($servico->valor_total ?? 0),
            'valor_plataforma' => $receber->exists ? $receber->valor_plataforma : 0,
            'quem_pagou' => $servico->oficina?->nome_fantasia,
            'cliente' => $servico->oficina?->nome_fantasia,
            'categoria' => $receber->categoria ?: 'Serviço',
            'data_lancamento' => $data,
            'data_vencimento' => $receber->data_vencimento ?: $data,
        ]);
        if (! $receber->exists) $receber->status = FinanceiroStatusEnum::PENDENTE;
        $receber->save();

        $pagar = ContaPagar::firstOrNew([
            'servico_id' => $servico->id,
            'origem' => 'aplicativo',
        ]);
        $pagar->fill([
            'oficina_id' => $servico->oficina_id,
            'tecnico_id' => $servico->tecnico_id,
            'referencia_veiculo_tipo' => $pagar->referencia_veiculo_tipo ?: $referenciaTipo,
            'descricao' => $descricao,
            'fornecedor' => $servico->tecnico?->nome_completo ?? $servico->tecnico_nome_manual,
            'categoria' => $pagar->categoria ?: 'Serviço',
            'valor_a_pagar' => $totais['tecnico'] ?? (float) ($servico->preco_tecnico ?? 0),
            'valor_pago' => $pagar->exists ? $pagar->valor_pago : 0,
            'comissao' => self::descricaoComissao($precos, (string) ($servico->moeda ?: 'EUR')),
            'data_lancamento' => $data,
            'data_vencimento' => $pagar->data_vencimento ?: $data,
        ]);
        if (! $pagar->exists) $pagar->status = FinanceiroStatusEnum::PENDENTE;
        $pagar->save();
    }

    private static function descricaoComissao(array $precos, string $moeda): ?string
    {
        $itens = ['carro' => 'Reparação', 'desmontagem' => 'Desmontagem'];
        $partes = [];
        foreach ($itens as $item => $rotulo) {
            $config = $precos['tecnico_'.$item] ?? null;
            if (! is_array($config) || ! isset($config['valor'])) continue;
            $valor = (float) $config['valor'];
            $partes[] = ($config['tipo'] ?? 'valor') === 'porcentagem'
                ? $rotulo.': '.rtrim(rtrim(number_format($valor, 2, '.', ''), '0'), '.').'%'
                : $rotulo.': '.$moeda.' '.number_format($valor, 2, ',', '.');
        }
        return $partes ? implode(' | ', $partes) : null;
    }
}
