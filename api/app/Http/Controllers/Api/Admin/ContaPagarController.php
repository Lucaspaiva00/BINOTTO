<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreUpdateContaPagarRequest;
use App\Http\Resources\Api\Admin\ContaPagarResource;
use App\Models\ContaPagar;
use Illuminate\Http\Request;

class ContaPagarController extends Controller
{
    public function index(Request $request)
    {
        $contasPagar = ContaPagar::query()
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('origem'), function ($query, $origem) {
                $query->where('origem', $origem);
            })
            ->when($request->input('tecnico_id'), function ($query, $tecnicoId) {
                $query->where('tecnico_id', $tecnicoId);
            })
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
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20));

        return ContaPagarResource::collection($contasPagar);
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
        $contaPagar = ContaPagar::find($id);

        if (!$contaPagar) {
            return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
        }

        return response()->json(['data' => new ContaPagarResource($contaPagar)]);
    }

    public function update(StoreUpdateContaPagarRequest $request, int $id)
    {
        $contaPagar = ContaPagar::find($id);

        if (!$contaPagar) {
            return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
        }

        $contaPagar->update($request->validated());

        return response()->json([
            'message' => __('main.conta_pagar_updated_success'),
            'data' => new ContaPagarResource($contaPagar->fresh()),
        ]);
    }

    public function destroy(int $id)
    {
        $contaPagar = ContaPagar::find($id);

        if (!$contaPagar) {
            return response()->json(['message' => __('main.conta_pagar_not_found')], 404);
        }

        $contaPagar->delete();

        return response()->json(['message' => __('main.conta_pagar_deleted_success')]);
    }
}
