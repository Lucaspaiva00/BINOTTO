<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreUpdateContaReceberRequest;
use App\Http\Resources\Api\Admin\ContaReceberResource;
use App\Models\ContaReceber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Servico;
use App\Models\ContaPagar;

class ContaReceberController extends Controller
{
    public function index(Request $request)
    {
        $date = 'DATE(COALESCE((SELECT COALESCE(data_servico, data_inicio, servicos.created_at) FROM servicos WHERE servicos.id = contas_receber.servico_id), data_emissao, data_lancamento, data_vencimento))';
        $payments = ContaPagar::query()->whereColumn('contas_pagar.servico_id', 'contas_receber.servico_id')
            ->whereNotNull('contas_pagar.tecnico_id')->where('status', '!=', 'cancelado')->where('valor_a_pagar', '>', 0);
        $contasReceber = ContaReceber::query()->select(array_diff(\Illuminate\Support\Facades\Schema::getColumnListing('contas_receber'), ['fatura_conteudo']))->with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])
            ->addSelect([
                'technician_payments' => (clone $payments)->selectRaw('COUNT(*)'),
                'technician_payments_complete' => (clone $payments)->where(function ($query) {
                    $query->where('status', 'pago')->orWhereColumn('valor_pago', '>=', 'valor_a_pagar');
                })->selectRaw('COUNT(*)'),
                'technician_payments_started' => (clone $payments)->where(function ($query) {
                    $query->where('status', 'pago')->orWhere('valor_pago', '>', 0);
                })->selectRaw('COUNT(*)'),
            ])
            ->when($request->filled('servico_de'), fn ($query) => $query->whereRaw("$date >= ?", [$request->input('servico_de')]))
            ->when($request->filled('servico_ate'), fn ($query) => $query->whereRaw("$date <= ?", [$request->input('servico_ate')]))
            ->when($request->filled('veiculo'), function ($query) use ($request) {
                $text = '%'.strtolower((string) $request->input('veiculo')).'%';
                $query->where(function ($inner) use ($text) {
                    $inner->whereRaw('LOWER(descricao) LIKE ?', [$text])
                        ->orWhereHas('servico.primeiroVeiculo', fn ($vehicle) => $vehicle->whereRaw('LOWER(marca_modelo) LIKE ?', [$text]));
                });
            })
            ->when($request->filled('referencia'), function ($query) use ($request) {
                $ref = '%'.strtoupper(preg_replace('/\s+/u', '', (string) $request->input('referencia')) ?? '').'%';
                $query->whereHas('servico.primeiroVeiculo', fn ($vehicle) => $vehicle->where(function ($inner) use ($ref) {
                    $inner->whereRaw("REPLACE(UPPER(placa), ' ', '') LIKE ?", [$ref])
                        ->orWhereRaw("REPLACE(UPPER(chassi), ' ', '') LIKE ?", [$ref]);
                }));
            })
            ->when($request->filled('tecnico'), function ($query) use ($request) {
                $name = '%'.strtolower((string) $request->input('tecnico')).'%';
                $query->where(function ($inner) use ($name) {
                    $inner->whereHas('tecnico', fn ($tech) => $tech->whereRaw('LOWER(nome_completo) LIKE ?', [$name]))
                        ->orWhereHas('servico', fn ($service) => $service->whereRaw('LOWER(tecnico_nome_manual) LIKE ?', [$name]));
                });
            })
            ->when($request->filled('valor_de') && is_numeric($request->input('valor_de')), fn ($query) => $query->where('valor_servico', '>=', (float) $request->input('valor_de')))
            ->when($request->filled('valor_ate') && is_numeric($request->input('valor_ate')), fn ($query) => $query->where('valor_servico', '<=', (float) $request->input('valor_ate')))
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('origem'), function ($query, $origem) {
                $query->where('origem', $origem);
            })
            ->when($request->input('oficina_id'), function ($query, $oficinaId) {
                $query->where('oficina_id', $oficinaId);
            })
            ->when($request->input('data_de'), function ($query, $dataDe) {
                $query->whereDate('data_vencimento', '>=', $dataDe);
            })
            ->when($request->input('data_ate'), function ($query, $dataAte) {
                $query->whereDate('data_vencimento', '<=', $dataAte);
            })
            ->when($request->input('busca'), function ($query, $busca) {
                $query->where('descricao', 'like', "%{$busca}%");
            })
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return ContaReceberResource::collection($contasReceber);
    }

    public function store(StoreUpdateContaReceberRequest $request)
    {
        $contaReceber = ContaReceber::create($request->validated());

        return response()->json([
            'message' => __('main.conta_receber_created_success'),
            'data' => new ContaReceberResource($contaReceber),
        ], 201);
    }

    public function show(int $id)
    {
        $contaReceber = ContaReceber::with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])->find($id);

        if (!$contaReceber) {
            return response()->json(['message' => __('main.conta_receber_not_found')], 404);
        }

        return response()->json(['data' => new ContaReceberResource($contaReceber)]);
    }

    public function update(StoreUpdateContaReceberRequest $request, int $id)
    {
        $contaReceber = ContaReceber::with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])->find($id);

        if (!$contaReceber) {
            return response()->json(['message' => __('main.conta_receber_not_found')], 404);
        }

        $contaReceber->update($request->validated());

        return response()->json([
            'message' => __('main.conta_receber_updated_success'),
            'data' => new ContaReceberResource($contaReceber->fresh()->load(['oficina', 'tecnico', 'servico.primeiroVeiculo'])),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $validated = $request->validate(['excluir_servico' => ['sometimes', 'boolean']]);
        $excluirServico = (bool) ($validated['excluir_servico'] ?? false);

        return DB::transaction(function () use ($id, $excluirServico) {
            $conta = ContaReceber::query()->lockForUpdate()->find($id);
            if (!$conta) {
                return response()->json(['message' => __('main.conta_receber_not_found')], 404);
            }

            $servico = $conta->servico_id
                ? Servico::query()->lockForUpdate()->find($conta->servico_id)
                : null;

            if ($excluirServico && $servico) {
                $outrasContas = ContaReceber::where('servico_id', $servico->id)
                    ->where('id', '!=', $id)->exists()
                    || ContaPagar::where('servico_id', $servico->id)
                    ->exists();
                if ($outrasContas || $servico->pericias()->exists()) {
                    return response()->json([
                        'message' => 'Este serviço possui outras movimentações financeiras ou perícias. Exclua apenas o lançamento ou trate os vínculos antes de excluir o serviço.',
                    ], 409);
                }
            }

            $conta->delete();
            if ($excluirServico && $servico) {
                $servico->delete();
            }

            return response()->json([
                'message' => $excluirServico && $servico
                    ? 'Lançamento e serviço excluídos com sucesso.'
                    : __('main.conta_receber_deleted_success'),
            ]);
        });
    }
}
