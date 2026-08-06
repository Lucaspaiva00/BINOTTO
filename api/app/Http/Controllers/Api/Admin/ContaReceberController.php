<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreUpdateContaReceberRequest;
use App\Http\Resources\Api\Admin\ContaReceberResource;
use App\Models\ContaReceber;
use Illuminate\Http\Request;

class ContaReceberController extends Controller
{
    public function index(Request $request)
    {
        $contasReceber = ContaReceber::query()
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
        $contaReceber = ContaReceber::find($id);

        if (!$contaReceber) {
            return response()->json(['message' => __('main.conta_receber_not_found')], 404);
        }

        return response()->json(['data' => new ContaReceberResource($contaReceber)]);
    }

    public function update(StoreUpdateContaReceberRequest $request, int $id)
    {
        $contaReceber = ContaReceber::find($id);

        if (!$contaReceber) {
            return response()->json(['message' => __('main.conta_receber_not_found')], 404);
        }

        $contaReceber->update($request->validated());

        return response()->json([
            'message' => __('main.conta_receber_updated_success'),
            'data' => new ContaReceberResource($contaReceber->fresh()),
        ]);
    }

    public function destroy(int $id)
    {
        $contaReceber = ContaReceber::find($id);

        if (!$contaReceber) {
            return response()->json(['message' => __('main.conta_receber_not_found')], 404);
        }

        $contaReceber->delete();

        return response()->json(['message' => __('main.conta_receber_deleted_success')]);
    }
}
