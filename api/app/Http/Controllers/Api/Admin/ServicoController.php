<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreServicoRequest;
use App\Http\Resources\Api\Admin\ServicoResource;
use App\Http\Services\CriarServicoService;
use App\Models\Oficina;
use App\Models\Servico;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ServicoController extends Controller
{
    public function __construct(
        private readonly CriarServicoService $criarServicoService,
    ) {
    }

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

    public function store(StoreServicoRequest $request)
    {
        try {
            $oficina = Oficina::findOrFail($request->integer('oficina_id'));

            $resultado = $this->criarServicoService->criar(
                $oficina,
                $request->user(),
                [
                    'moeda' => $request->input('moeda', 'EUR'),
                    'observacoes' => $request->input('observacoes'),
                    'data_inicio' => $request->input('data_inicio'),
                    'data_fim' => $request->input('data_fim'),
                    'quantidade' => $request->input('quantidade'),
                    'quantidade_tipo' => $request->input('quantidade_tipo'),
                    'descricaoLog' => 'Administrador criou o serviço',
                ]
            );

            $servico = $resultado['servico']->load([
                'oficina',
                'tecnico',
                'primeiroVeiculo',
                'criadoPor.oficina',
                'criadoPor.tecnico',
            ]);

            return response()->json(['data' => new ServicoResource($servico)], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('Erro ao criar serviço (admin)', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['message' => __('main.service_create_error')], 500);
        }
    }
}
