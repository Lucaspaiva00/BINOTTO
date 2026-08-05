<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Admin\ServicoResource;
use App\Models\Servico;
use Illuminate\Http\Request;

class ServicoController extends Controller
{
    public function index(Request $request)
    {
        $servicos = Servico::with([
            'oficina',
            'tecnico',
            'primeiroVeiculo',
            'criadoPor.oficina',
            'criadoPor.tecnico',
        ])
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('pais'), function ($query, $pais) {
                $query->whereHas('oficina', fn ($o) => $o->where('pais', $pais));
            })
            ->when($request->input('busca'), function ($query, $busca) {
                $termo = trim($busca);
                $placa = strtoupper(str_replace('-', '', $termo));

                $query->where(function ($q) use ($termo, $placa) {
                    $q->whereHas('oficina', function ($o) use ($termo) {
                        $o->where('nome_fantasia', 'like', "%{$termo}%")
                            ->orWhere('cidade', 'like', "%{$termo}%");
                    })
                        ->orWhereHas('tecnico', fn ($t) => $t->where('nome_completo', 'like', "%{$termo}%"))
                        ->orWhereHas('criadoPor.oficina', fn ($o) => $o->where('nome_fantasia', 'like', "%{$termo}%"))
                        ->orWhereHas('criadoPor.tecnico', fn ($t) => $t->where('nome_completo', 'like', "%{$termo}%"))
                        ->orWhereHas('primeiroVeiculo', fn ($v) => $v->where('placa', 'like', "%{$placa}%"));

                    if (is_numeric($termo)) {
                        $q->orWhere('id', $termo);
                    }
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return ServicoResource::collection($servicos);
    }

    public function show(int $id)
    {
        $servico = Servico::with([
            'oficina',
            'tecnico',
            'primeiroVeiculo',
            'pericias',
            'criadoPor.oficina',
            'criadoPor.tecnico',
            'logs.oficina',
            'logs.tecnico',
        ])->find($id);

        if (! $servico) {
            return response()->json(['message' => __('main.service_not_found')], 404);
        }

        return response()->json(['data' => new ServicoResource($servico)]);
    }
}
