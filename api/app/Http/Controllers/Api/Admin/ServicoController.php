<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ServicoLogTipoEnum;
use App\Enums\ServicoStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\StoreServicoRequest;
use App\Http\Resources\Api\Admin\ServicoResource;
use App\Http\Services\CriarServicoService;
use App\Models\Oficina;
use App\Models\Servico;
use App\Models\ServicoLog;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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
                        ->orWhereHas('primeiroVeiculo', function ($v) use ($placa, $termo) {
                            $v->where('placa', 'like', "%{$placa}%")
                                ->orWhere('marca_modelo', 'like', "%{$termo}%")
                                ->orWhere('chassi', 'like', "%{$termo}%");
                        });

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

    /**
     * Cria uma solicitação administrativa, seguindo o mesmo fluxo do app da oficina.
     */
    public function store(StoreServicoRequest $request)
    {
        try {
            $oficina = Oficina::findOrFail($request->integer('oficina_id'));

            $resultado = $this->criarServicoService->criar(
                $oficina,
                $request->user(),
                [
                    // A moeda não é mais solicitada na tela. O sistema trabalha com EUR nesse fluxo.
                    'moeda' => 'EUR',
                    'observacoes' => $request->input('observacoes'),
                    'data_inicio' => $request->input('data_inicio'),
                    'data_fim' => $request->input('data_fim'),
                    'quantidade' => $request->input('quantidade'),
                    'quantidade_tipo' => $request->input('quantidade_tipo'),
                    'descricaoLog' => 'Administrador criou a solicitação',
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
            Log::error('Erro ao criar solicitação (admin)', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['message' => __('main.service_create_error')], 500);
        }
    }

    /**
     * Cria um serviço completo diretamente pelo painel administrativo.
     */
    public function storeDirect(Request $request)
    {
        $data = $this->validateAdminService($request, true);

        try {
            $servico = DB::transaction(function () use ($request, $data) {
                $servico = Servico::create([
                    'oficina_id' => $data['oficina_id'],
                    'tecnico_id' => $data['tecnico_id'] ?? null,
                    'criado_por_usuario_id' => $request->user()->id,
                    'data_inicio' => $data['data_inicio'] ?? null,
                    'data_fim' => $data['data_fim'] ?? null,
                    'quantidade_tipo' => 'carros',
                    'quantidade' => 1,
                    'moeda' => 'EUR',
                    'valor_total' => $data['valor_total'] ?? 0,
                    'preco_tecnico' => ($data['remuneracao_tipo'] ?? null) === 'valor'
                        ? ($data['remuneracao_tecnico'] ?? null)
                        : null,
                    'percentual_tecnico' => ($data['remuneracao_tipo'] ?? null) === 'porcentagem'
                        ? ($data['remuneracao_tecnico'] ?? null)
                        : null,
                    'status' => $data['status'],
                    'observacoes' => $data['observacoes'] ?? null,
                    'disponivel_para_todos' => false,
                    'liberado_para_todos_em' => now(),
                ]);

                $servico->veiculos()->create([
                    'placa' => $this->nullableUpper($data['placa'] ?? null),
                    'chassi' => $this->nullableUpper($data['chassi'] ?? null),
                    'marca_modelo' => $data['marca_modelo'] ?? null,
                    'preco_total' => $data['valor_total'] ?? 0,
                    'reparos_execucao' => [],
                ]);

                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'oficina_id' => $servico->oficina_id,
                    'tecnico_id' => $servico->tecnico_id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_CRIADO,
                    'descricao' => 'Administrador criou o serviço diretamente',
                    'payload' => [
                        'status' => $servico->status?->value,
                        'valor_total' => $servico->valor_total,
                        'preco_tecnico' => $servico->preco_tecnico,
                        'percentual_tecnico' => $servico->percentual_tecnico,
                    ],
                ]);

                return $servico;
            });

            return response()->json([
                'data' => new ServicoResource($servico->fresh()->load([
                    'oficina', 'tecnico', 'primeiroVeiculo', 'criadoPor.oficina', 'criadoPor.tecnico',
                ])),
            ], 201);
        } catch (Exception $e) {
            Log::error('Erro ao criar serviço completo (admin)', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['message' => __('main.service_create_error')], 500);
        }
    }

    /**
     * Edição centralizada da tela de serviço do painel.
     */
    public function update(Request $request, int $id)
    {
        $servico = Servico::with('primeiroVeiculo')->find($id);
        if (! $servico) {
            return response()->json(['message' => __('main.service_not_found')], 404);
        }

        $data = $this->validateAdminService($request, false);

        try {
            DB::transaction(function () use ($servico, $data) {
                $updates = [];
                foreach (['oficina_id', 'tecnico_id', 'data_inicio', 'data_fim', 'status', 'observacoes'] as $field) {
                    if (array_key_exists($field, $data)) {
                        $updates[$field] = $data[$field];
                    }
                }

                if (array_key_exists('valor_total', $data)) {
                    // Zero é um valor válido e não pode ser convertido em null por lógica truthy/falsy.
                    $updates['valor_total'] = $data['valor_total'];
                }

                if (array_key_exists('remuneracao_tipo', $data)) {
                    $valor = $data['remuneracao_tecnico'] ?? null;
                    if ($data['remuneracao_tipo'] === 'porcentagem') {
                        $updates['percentual_tecnico'] = $valor;
                        $updates['preco_tecnico'] = null;
                    } elseif ($data['remuneracao_tipo'] === 'valor') {
                        $updates['preco_tecnico'] = $valor;
                        $updates['percentual_tecnico'] = null;
                    } else {
                        $updates['preco_tecnico'] = null;
                        $updates['percentual_tecnico'] = null;
                    }
                }

                if ($updates) {
                    $servico->update($updates);
                }

                $hasVehicleFields = collect(['placa', 'chassi', 'marca_modelo', 'valor_total'])
                    ->contains(fn ($key) => array_key_exists($key, $data));

                if ($hasVehicleFields) {
                    $veiculo = $servico->primeiroVeiculo ?: $servico->veiculos()->create([
                        'preco_total' => 0,
                        'reparos_execucao' => [],
                    ]);

                    $vehicleUpdates = [];
                    if (array_key_exists('placa', $data)) {
                        $vehicleUpdates['placa'] = $this->nullableUpper($data['placa']);
                    }
                    if (array_key_exists('chassi', $data)) {
                        $vehicleUpdates['chassi'] = $this->nullableUpper($data['chassi']);
                    }
                    if (array_key_exists('marca_modelo', $data)) {
                        $vehicleUpdates['marca_modelo'] = $data['marca_modelo'];
                    }
                    if (array_key_exists('valor_total', $data)) {
                        $vehicleUpdates['preco_total'] = $data['valor_total'];
                    }
                    if ($vehicleUpdates) {
                        $veiculo->update($vehicleUpdates);
                    }
                }

                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'oficina_id' => $servico->oficina_id,
                    'tecnico_id' => $servico->tecnico_id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_ATUALIZADO,
                    'descricao' => 'Administrador atualizou o serviço',
                    'payload' => [
                        'status' => $servico->status?->value,
                        'valor_total' => $servico->valor_total,
                        'preco_tecnico' => $servico->preco_tecnico,
                        'percentual_tecnico' => $servico->percentual_tecnico,
                    ],
                ]);
            });

            return response()->json([
                'data' => new ServicoResource($servico->fresh()->load([
                    'oficina',
                    'tecnico',
                    'primeiroVeiculo',
                    'pericias',
                    'criadoPor.oficina',
                    'criadoPor.tecnico',
                    'logs.oficina',
                    'logs.tecnico',
                ])),
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao atualizar serviço (admin)', [
                'servico_id' => $id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json(['message' => 'Erro ao atualizar serviço.'], 500);
        }
    }

    private function validateAdminService(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';
        $statusValues = array_column(ServicoStatusEnum::cases(), 'value');

        return $request->validate([
            'oficina_id' => [$required, 'integer', 'exists:oficinas,id'],
            'tecnico_id' => ['sometimes', 'nullable', 'integer', 'exists:tecnicos,id'],
            'status' => [$required, 'string', Rule::in($statusValues)],
            'data_inicio' => ['sometimes', 'nullable', 'date'],
            'data_fim' => ['sometimes', 'nullable', 'date', 'after_or_equal:data_inicio'],
            'placa' => ['sometimes', 'nullable', 'string', 'max:20'],
            'chassi' => ['sometimes', 'nullable', 'string', 'max:30'],
            'marca_modelo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'valor_total' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'remuneracao_tipo' => ['sometimes', 'nullable', Rule::in(['valor', 'porcentagem'])],
            'remuneracao_tecnico' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'observacoes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);
    }

    private function nullableUpper(?string $value): ?string
    {
        $value = trim((string) $value);
        return $value === '' ? null : strtoupper($value);
    }
}
