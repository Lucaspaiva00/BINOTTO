<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreUpdateContaPagarRequest;
use App\Http\Resources\Api\Admin\ContaPagarResource;
use App\Models\ContaPagar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Models\Servico;
use App\Models\ContaReceber;

class ContaPagarController extends Controller
{
    public function index(Request $request)
    {
        $query = ContaPagar::query()->select(array_diff(\Illuminate\Support\Facades\Schema::getColumnListing('contas_pagar'), ['fatura_conteudo']))->with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('origem'), function ($query, $origem) {
                $query->where('origem', $origem);
            })
            ->when($request->input('tecnico_id'), function ($query, $tecnicoId) {
                $query->where('tecnico_id', $tecnicoId);
            })
            ->when($request->filled('numero_fatura'), function ($query) use ($request) {
                $query->whereRaw('LOWER(numero_fatura) LIKE ?', ['%'.mb_strtolower((string) $request->input('numero_fatura')).'%']);
            })
            ->when($request->filled('fatura'), function ($query) use ($request) {
                $term = '%'.mb_strtolower((string) $request->input('fatura')).'%';
                $query->where(function ($inner) use ($term) {
                    $inner->whereRaw('LOWER(fatura) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(numero_fatura) LIKE ?', [$term]);
                });
            })
            ->when(is_numeric($request->input('iva')), fn ($query) => $query->where('iva', (float) $request->input('iva')))
            ->when($request->filled('contabilidade'), fn ($query) => $query->whereRaw('LOWER(contabilidade) LIKE ?', ['%'.mb_strtolower((string) $request->input('contabilidade')).'%']))
            ->when($request->filled('cidade'), fn ($query) => $query->whereHas('tecnico', fn ($tecnico) => $tecnico->whereRaw('LOWER(endereco_cidade) LIKE ?', ['%'.mb_strtolower((string) $request->input('cidade')).'%'])))
            ->when($request->filled('pais'), fn ($query) => $query->whereHas('tecnico', fn ($tecnico) => $tecnico->whereRaw('LOWER(pais_atual) LIKE ?', ['%'.mb_strtolower((string) $request->input('pais')).'%'])))
            ->when($request->filled('valor_de') && is_numeric($request->input('valor_de')), fn ($query) => $query->where('valor_a_pagar', '>=', (float) $request->input('valor_de')))
            ->when($request->filled('valor_ate') && is_numeric($request->input('valor_ate')), fn ($query) => $query->where('valor_a_pagar', '<=', (float) $request->input('valor_ate')))
            ->when($request->input('oficina_id'), function ($query, $oficinaId) {
                $query->where('oficina_id', $oficinaId);
            })
            ->when($request->input('busca'), function ($query, $busca) {
                $query->where('descricao', 'like', "%{$busca}%");
            })
            ->when($request->input('data_de'), function ($query, $dataDe) {
                $query->whereDate('data_vencimento', '>=', $dataDe);
            })
            ->when($request->input('data_ate'), function ($query, $dataAte) {
                $query->whereDate('data_vencimento', '<=', $dataAte);
            })
            ->orderByDesc('id');

        $today = Carbon::today()->toDateString();
        $nextMonthStart = Carbon::today()->startOfMonth()->addMonth()->toDateString();
        $monthAfterNextStart = Carbon::today()->startOfMonth()->addMonths(2)->toDateString();
        $summaryQuery = (clone $query)->reorder()->select(['status', 'valor_a_pagar', 'valor_pago', 'data_vencimento']);
        $summaryRows = $summaryQuery->get();
        $summary = ['overdue' => 0.0, 'next_month' => 0.0, 'total_to_pay' => 0.0];
        foreach ($summaryRows as $row) {
            $status = $row->status instanceof \BackedEnum ? $row->status->value : $row->status;
            if ($status === 'cancelado') continue;
            $outstanding = max(0, (float) $row->valor_a_pagar - (float) $row->valor_pago);
            $summary['total_to_pay'] += $outstanding;
            $dueDate = $row->data_vencimento?->toDateString() ?? (string) $row->data_vencimento;
            if ($dueDate !== '' && $dueDate < $today) $summary['overdue'] += $outstanding;
            if ($dueDate !== '' && $dueDate >= $nextMonthStart && $dueDate < $monthAfterNextStart) $summary['next_month'] += $outstanding;
        }

        $contasPagar = (clone $query)->paginate($request->integer('per_page', 20));

        return ContaPagarResource::collection($contasPagar)->additional(['summary' => $summary]);
    }

    public function store(StoreUpdateContaPagarRequest $request)
    {
        $contaPagar = ContaPagar::create($request->validated());

        return response()->json([
            'message' => __('main.conta_pagar_created_success'),
            'data' => new ContaPagarResource($contaPagar),
        ], 201);
    }

    public function show(int $id)
    {
        $contaPagar = ContaPagar::with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])->find($id);

        if (!$contaPagar) {
            return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
        }

        return response()->json(['data' => new ContaPagarResource($contaPagar)]);
    }

    public function update(StoreUpdateContaPagarRequest $request, int $id)
    {
        $contaPagar = ContaPagar::with(['oficina', 'tecnico', 'servico.primeiroVeiculo'])->find($id);

        if (!$contaPagar) {
            return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
        }

        $contaPagar->update($request->validated());

        return response()->json([
            'message' => __('main.conta_pagar_updated_success'),
            'data' => new ContaPagarResource($contaPagar->fresh()->load(['oficina', 'tecnico', 'servico.primeiroVeiculo'])),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $validated = $request->validate(['excluir_servico' => ['sometimes', 'boolean']]);
        $excluirServico = (bool) ($validated['excluir_servico'] ?? false);

        return DB::transaction(function () use ($id, $excluirServico) {
            $conta = ContaPagar::query()->lockForUpdate()->find($id);
            if (!$conta) {
                return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
            }

            $servico = $conta->servico_id
                ? Servico::query()->lockForUpdate()->find($conta->servico_id)
                : null;

            if ($excluirServico && $servico) {
                $outrasContas = ContaReceber::where('servico_id', $servico->id)
                    ->exists()
                    || ContaPagar::where('servico_id', $servico->id)
                    ->where('id', '!=', $id)->exists();
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
                    : __('main.conta_pagar_deleted_success'),
            ]);
        });
    }
}
