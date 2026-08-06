<?php

namespace App\Http\Controllers\Api\Mobile\Tecnico;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoLogTipoEnum;
use App\Enums\ServicoStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Services\PushNotificationService;
use App\Models\DispositivoUsuario;
use App\Models\Oficina;
use App\Models\Pericia;
use App\Models\Servico;
use App\Models\ServicoLog;
use App\Models\ServicoRecusado;
use App\Models\ServicoVeiculo;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TecnicoServicoController extends Controller
{
    private PushNotificationService $pushNotificationService;

    private $localeMap = [
        'pt-BR' => 'pt',
        'fr-FR' => 'fr',
        'it-IT' => 'it',
    ];

    public function __construct(PushNotificationService $pushNotificationService)
    {
        $this->pushNotificationService = $pushNotificationService;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $tecnico = $user->tecnico;

        $date = $request->input('date');
        $statusFilter = $request->input('status');

        $servicos = Servico::with(['oficina:id,nome_fantasia', 'tecnico', 'primeiroVeiculo'])
            ->visiveisParaTecnico($tecnico->id)
            ->when($request->boolean('hide_rejected'), function ($query) use ($tecnico) {
                $query->whereDoesntHave('recusas', function ($q) use ($tecnico) {
                    $q->where('tecnico_id', $tecnico->id);
                });
            })
            ->when(! $date, function ($query) {
                $query->whereNotIn('status', [
                    ServicoStatusEnum::CANCELADO->value,
                    ServicoStatusEnum::FINALIZADO->value,
                    ServicoStatusEnum::CONCLUIDO->value,
                ]);
            })
            ->when($date, function ($query) use ($date) {
                $query->whereDate('data_inicio', $date);
            })
            ->when($statusFilter, function ($query) use ($statusFilter) {
                $query->whereIn('status', $statusFilter);
            })
            ->orderByRaw("
                CASE
                    WHEN status = '".ServicoStatusEnum::EM_EXECUCAO->value."' THEN 0
                    ELSE 1
                END
            ")
            ->orderByDesc('data_inicio')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $servicos,
        ]);
    }

    public function listConcluidos(Request $request)
    {
        $user = auth()->user();
        $tecnico = $user->tecnico;

        $query = Servico::with(['tecnico', 'oficina', 'primeiroVeiculo'])
            ->where('tecnico_id', $tecnico?->id)
            ->whereIn('status', [
                ServicoStatusEnum::CONCLUIDO,
                ServicoStatusEnum::FINALIZADO,
                ServicoStatusEnum::CANCELADO,
            ]);

        // aplicando filtros
        if ($request->filled('dias')) {
            $query->where('created_at', '>=', now()->subDays((int) $request->dias));
        }

        if ($request->filled('data_inicial')) {
            $query->whereDate('created_at', '>=', $request->data_inicial);
        }

        if ($request->filled('data_final')) {
            $query->whereDate('created_at', '<=', $request->data_final);
        }

        if ($request->filled('oficinaPlaca')) {
            $term = trim($request->oficinaPlaca);
            $termUpper = strtoupper(str_replace('-', '', trim($request->oficinaPlaca)));

            $query->where(function ($q) use ($term, $termUpper) {
                $q->whereHas('oficina', function ($oficina) use ($term) {
                    $oficina->where('nome_fantasia', 'like', "%{$term}%");
                })
                    ->orWhereHas('primeiroVeiculo', function ($veiculo) use ($termUpper) {
                        $veiculo->where('placa', 'like', "%{$termUpper}%");
                    });
            });
        }

        $query->orderByDesc('created_at');

        return response()->json([
            'success' => true,
            'data' => $query->paginate(10),
        ]);
    }

    public function agendaCalendar(Request $request)
    {
        $user = auth()->user();
        $tecnico = $user->tecnico;

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        $servicos = Servico::with(['tecnico', 'primeiroVeiculo'])
            ->withExists([
                'recusas as foi_recusado' => function ($query) use ($tecnico) {
                    $query->where('tecnico_id', $tecnico->id);
                },
            ])
            ->visiveisParaTecnico($tecnico->id)
            ->whereBetween('data_inicio', [$startOfMonth, $endOfMonth])
            ->get(['data_inicio', 'status']);

        // Retornando agrupado por data
        $servicesGrouped = $servicos
            ->groupBy(fn ($item) => Carbon::parse($item->data_inicio)->format('Y-m-d'))
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'status' => $item->foi_recusado
                            ? 'recusado'
                            : $item->status->value,
                    ];
                })->values();
            });

        return response()->json([
            'success' => true,
            'data' => $servicesGrouped,
            'startOfMonth' => $startOfMonth->toDateString(),
            'endOfMonth' => $endOfMonth->toDateString(),
        ]);
    }

    public function show(int $id)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $servico = Servico::with([
                'tecnico',
                'oficina',
                'primeiroVeiculo',
                'periciaEmExecucao',
                'periciaAbertaVinculada',
            ])->where('id', $id)->first();

            if (! $servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            if ($servico->tecnico_id !== null && $servico->tecnico_id !== $tecnico->id) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            $ultimaPericia = $servico->pericias()
                ->where('tecnico_id', $tecnico->id)
                ->orderBy('id', 'desc')
                ->first();

            $servico->setRelation('pericia', $ultimaPericia);

            return response()->json([
                'success' => true,
                'data' => $servico,
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao buscar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_fetch_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function accept(Request $request, int $id)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            if (! $tecnico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 401);
            }

            $data = $request->validate([
                'data_prevista_chegada' => ['required', 'date'],
                'horario_previsto_chegada' => [
                    'required',
                    'string',
                    'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]$/',
                ],
            ]);

            $servico = DB::transaction(function () use ($id, $tecnico, $data) {
                $servico = Servico::with(['oficina'])->where('id', $id)
                    ->lockForUpdate()
                    ->first();

                $oficina = $servico->oficina;

                if (! $servico) {
                    return null;
                }

                if (! $servico->isAvailableFor($tecnico)) {
                    return null;
                }

                $servico->update([
                    'tecnico_label' => $oficina->nome_fantasia,
                    'oficina_label' => $tecnico->nome_completo,
                    'status' => ServicoStatusEnum::ACEITO->value,
                    'tecnico_id' => $tecnico->id,
                    'data_prevista_chegada' => $data['data_prevista_chegada'],
                    'horario_previsto_chegada' => $data['horario_previsto_chegada'],
                    'aceito_em' => now(),
                ]);

                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'tecnico_id' => $tecnico->id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_ACEITO,
                    'descricao' => 'Técnico aceitou o serviço',
                    'payload' => [
                        'data_prevista_chegada' => $data['data_prevista_chegada'],
                        'horario_previsto_chegada' => $data['horario_previsto_chegada'],
                    ],
                ]);

                return $servico->fresh();
            });

            if (! $servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_unavailable'),
                ], 404);
            }

            // Notifica a oficina via push notification
            try {
                $oficina = Oficina::find($servico->oficina_id);

                if ($oficina?->usuario_id) {
                    $devices = DispositivoUsuario::where('usuario_id', $oficina->usuario_id)
                        ->get(['token', 'idioma'])
                        ->unique('token')
                        ->filter(fn ($d) => ! empty($d->token));

                    foreach ($devices as $device) {
                        $locale = $this->localeMap[$device->idioma] ?? 'pt';

                        $this->pushNotificationService->sendToToken($device->token, [
                            'title' => __('notifications.service_accepted_title', [], $locale),
                            'body' => __('notifications.service_accepted_body', [], $locale),
                            'data' => [
                                'type' => 'SERVICE_ACCEPTED',
                                'target_role' => 'WORKSHOP',
                                'servico_id' => (string) $servico->id,
                            ],
                        ]);
                    }
                }
            } catch (Exception $e) {
                Log::error('Erro ao enviar notificação push', [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => __('main.service_accept_success'),
                'data' => $servico,
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao aceitar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_accept_error'),
            ], 500);
        }
    }

    public function cancelAccept(Request $request, int $id)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            if (! $tecnico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 401);
            }

            $data = $request->validate([
                'motivo' => ['nullable', 'string', 'max:50'],
            ]);

            $servico = Servico::with(['oficina', 'periciaAbertaVinculada'])
                ->where('tecnico_id', $tecnico->id)
                ->where('id', $id)
                ->first();

            if (! $servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_unavailable'),
                ], 404);
            }

            DB::beginTransaction();

            ServicoLog::create([
                'servico_id' => $servico->id,
                'tecnico_id' => $tecnico->id,
                'tipo' => ServicoLogTipoEnum::ACEITE_CANCELADO,
                'motivo' => $data['motivo'] ?? null,
                'descricao' => 'Técnico cancelou o aceite do serviço',
                'payload' => [],
            ]);

            $servico->update([
                'tecnico_label' => $servico->oficina->cidade,
                'oficina_label' => null,
                'status' => ServicoStatusEnum::AGUARDANDO->value,
                'tecnico_id' => null,
                'aceito_em' => null,
                'data_prevista_chegada' => null,
                'horario_previsto_chegada' => null,
            ]);

            if ($servico->periciaAbertaVinculada) {
                $servico->periciaAbertaVinculada->update([
                    'status' => PericiaStatusEnum::ABERTA->value,
                    'servico_id' => null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_cancel_accept_success'),
                'data' => $servico,
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao cancelar aceite de serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_cancel_accept_error'),
            ], 500);
        }
    }

    public function refuse(int $id)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            if (! $tecnico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 401);
            }

            $servico = Servico::where('id', $id)->first();

            if (! $servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_unavailable'),
                ], 404);
            }

            DB::beginTransaction();

            ServicoRecusado::firstOrCreate([
                'servico_id' => $servico->id,
                'tecnico_id' => $tecnico->id,
            ]);

            $ids = $servico->ids_tecnico_recusa ?? [];

            if (! in_array($tecnico->id, $ids)) {
                $ids[] = $tecnico->id;
                $servico->ids_tecnico_recusa = $ids;
                $servico->save();
            }

            ServicoLog::create([
                'servico_id' => $servico->id,
                'tecnico_id' => $tecnico->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_RECUSADO,
                'descricao' => 'Técnico recusou o serviço',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_reject_success'),
                'data' => [],
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao recusar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_reject_error'),
            ], 500);
        }
    }

    public function getSimultaneousServices(int $oficinaId)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $servicos = Servico::where('oficina_id', $oficinaId)
                ->where('tecnico_id', $tecnico->id)
                ->whereDate('data_prevista_chegada', today())
                ->whereIn('status', [ServicoStatusEnum::ACEITO->value])
                ->orderByDesc('id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $servicos,
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao verificar serviço do dia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_day_check_error'),
            ], 500);
        }
    }

    /* Inicia o carro com perícia */
    public function startCar(Request $request)
    {
        $data = $request->validate([
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string'],
            'chassi' => ['required', 'string'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'string', 'in:simples,completa'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
            'fotos_remover' => ['nullable', 'json'],
            'fotos_reparos_remover' => ['nullable', 'json'],
            'fotos_pericia_completa_remover' => ['nullable', 'json'],
        ]);

        $uploadedFotosBasePaths = [];
        $uploadedFotosPericiaPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;
            $oficina = Oficina::find($data['oficina_id']);
            $servico = null;

            DB::beginTransaction();

            if (!isset($data['servico_id'])) {
                $servico = Servico::create([
                    'tecnico_label' => $oficina->nome_fantasia,
                    'oficina_id' => $oficina->id,
                    'tecnico_id' => $tecnico->id,
                    'criado_por_usuario_id' => $user->id,
                    'data_inicio' => now()->toDateString(),
                    'status' => ServicoStatusEnum::EM_EXECUCAO->value,
                    'disponivel_para_todos' => false,
                    'pericia_completa' => 0,
                    'quantidade_tipo' => 'carros',
                    'quantidade' => 1,
                    'valor_total' => $data['preco_sugerido'] ?? 0,
                    'data_prevista_chegada' => now()->toDateString(),
                    'horario_previsto_chegada' => now()->format('H:i'),
                    'moeda' => 'EUR',
                    'aceito_em' => now(),
                ]);
            } else {
                $servico = Servico::where('id', $data['servico_id'])
                    ->where('tecnico_id', $tecnico->id)
                    ->first();

                $servico->update([
                    'tecnico_label' => $oficina->nome_fantasia,
                    'valor_total' => $data['preco_sugerido'] ?? 0,
                    'status' => ServicoStatusEnum::EM_EXECUCAO->value,
                ]);
            }

            $veiculo = ServicoVeiculo::create([
                'servico_id' => $servico->id,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
            ]);

            $pericia = $servico->periciaAbertaVinculada;

            if ($pericia) {
                // Fotos base
                $fotos = $pericia->fotos ?? [];
                $fotosRemover = json_decode($request->input('fotos_remover', '[]'), true) ?? [];

                if (! empty($fotosRemover)) {
                    $this->removerFotos($fotosRemover);
                    $fotos = array_diff($fotos, $fotosRemover);
                }

                if ($request->hasFile('fotos')) {
                    $uploadedFotosBasePaths = $this->salvarFotosPericia(
                        $request->file('fotos'),
                        $pericia->id,
                    );

                    $fotos = array_merge($fotos, $uploadedFotosBasePaths);
                }

                // Fotos da perícia completa
                $fotosPericiaCompleta = $pericia->fotos_pericia_completa ?? [];

                if ($data['tipo'] === 'completa') {
                    $fotosPericiaCompletaRemover = json_decode($request->input('fotos_pericia_completa_remover', '[]'), true) ?? [];

                    if (! empty($fotosPericiaCompletaRemover)) {
                        $this->removerFotos($fotosPericiaCompletaRemover);
                        $fotosPericiaCompleta = array_diff($fotosPericiaCompleta, $fotosPericiaCompletaRemover);
                    }

                    if ($request->hasFile('fotos_pericia_completa')) {
                        $uploadedFotosPericiaPaths = $this->salvarFotosPericia(
                            $request->file('fotos_pericia_completa'),
                            $pericia->id,
                            true
                        );

                        $fotosPericiaCompleta = array_merge($fotosPericiaCompleta, $uploadedFotosPericiaPaths);
                    }
                }

                // Salvando informações dos reparos necessários
                $fotosReparos = $this->salvarFotosReparos($request->file('fotos_reparos', []), $pericia->id, true);
                $uploadedFotosReparosPaths = $fotosReparos;
                $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
                $reparosAtuais = $pericia->reparos_necessarios ?? [];
                $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson, $reparosAtuais);
                $fotosReparosRemover = json_decode($request->input('fotos_reparos_remover', '[]'), true) ?? [];
                $remocoesPorPeca = [];

                foreach ($fotosReparosRemover as $remocao) {
                    $remocoesPorPeca[$remocao['partId']][] = $remocao['path'];
                }

                foreach ($reparosNecessarios as &$reparo) {
                    $peca = $reparo['peca'];

                    $fotosPeca = array_merge(
                        $reparo['fotos'] ?? [],
                        $fotosReparos[$peca] ?? []
                    );

                    if (isset($remocoesPorPeca[$peca])) {
                        $fotosPeca = array_diff($fotosPeca, $remocoesPorPeca[$peca]);
                    }

                    $reparo['fotos'] = array_values($fotosPeca);
                }
                unset($reparo);

                if (!empty($remocoesPorPeca)) {
                    $this->removerFotosReparos($remocoesPorPeca);
                }

                $pericia->update([
                    'placa' => $data['placa'],
                    'chassi' => $data['chassi'],
                    'marca_modelo' => $data['marca_modelo'],
                    'tipo' => $data['tipo'],
                    'status' => PericiaStatusEnum::EM_EXECUCAO->value,
                    'preco_sugerido' => $data['preco_sugerido'] ?? null,
                    'valor_pericia' => $data['valor_pericia'] ?? null,
                    'fotos' => $fotos,
                    'fotos_pericia_completa' => $fotosPericiaCompleta,
                    'reparos_necessarios' => $reparosNecessarios,
                ]);
            } else {
                $pericia = Pericia::create([
                    'tecnico_id' => $tecnico->id,
                    'oficina_id' => $oficina->id,
                    'servico_id' => $servico->id,
                    'placa' => $data['placa'],
                    'chassi' => $data['chassi'],
                    'marca_modelo' => $data['marca_modelo'],
                    'tipo' => $data['tipo'],
                    'status' => PericiaStatusEnum::EM_EXECUCAO->value,
                    'moeda' => 'EUR',
                    'preco_sugerido' => $data['preco_sugerido'] ?? null,
                    'valor_pericia' => $data['valor_pericia'] ?? null,
                ]);

                // Salva fotos
                if ($request->hasFile('fotos')) {
                    $uploadedFotosBasePaths = $this->salvarFotosPericia(
                        $request->file('fotos'),
                        $pericia->id,
                    );

                    $pericia->update([
                        'fotos' => $uploadedFotosBasePaths,
                    ]);
                }

                // Salva fotos da perícia completa
                if ($data['tipo'] === 'completa') {
                    if ($request->hasFile('fotos_pericia_completa')) {
                        $uploadedFotosPericiaPaths = $this->salvarFotosPericia(
                            $request->file('fotos_pericia_completa'),
                            $pericia->id,
                            true
                        );

                        $pericia->update([
                            'fotos_pericia_completa' => $uploadedFotosPericiaPaths,
                        ]);
                    }
                }

                // Salvando informações dos reparos necessários
                $fotosReparos = $this->salvarFotosReparos($request->file('fotos_reparos', []), $pericia->id, true);
                $uploadedFotosReparosPaths = $fotosReparos;
                $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
                $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson, []);

                foreach ($reparosNecessarios as &$reparo) {
                    $peca = $reparo['peca'];
                    $fotos = $fotosReparos[$peca] ?? [];
                    $reparo['fotos'] = array_values($fotos);
                }
                unset($reparo);

                $pericia->update([
                    'reparos_necessarios' => $reparosNecessarios,
                ]);
            }

            ServicoLog::create([
                'servico_id' => $servico->id,
                'pericia_id' => $pericia->id,
                'tecnico_id' => $tecnico->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_INICIADO,
                'descricao' => 'Carro iniciado',
                'payload' => [
                    'placa' => $data['placa'],
                    'chassi' => $data['chassi'],
                    'marca_modelo' => $data['marca_modelo'],
                    'tipo_pericia' => $data['tipo'],
                    'preco_sugerido' => $data['preco_sugerido'] ?? null,
                    'valor_pericia' => $data['valor_pericia'] ?? null,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_start_success'),
                'data' => $servico->load(['oficina', 'tecnico']),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotos($uploadedFotosBasePaths);
            $this->removerFotos($uploadedFotosPericiaPaths);
            $this->removerFotosReparos($uploadedFotosReparosPaths);

            Log::error('Erro ao iniciar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_start_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /* Inicia o carro através de uma perícia */
    public function startCarFromInspection(Request $request, int $periciaId)
    {
        $data = $request->validate([
            'oficina_id' => ['nullable', 'exists:oficinas,id'],
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['nullable', 'string'],
            'chassi' => ['nullable', 'string'],
            'marca_modelo' => ['nullable', 'string', 'max:255'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
        ]);

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $pericia = Pericia::with(['servico'])
                ->where('id', $periciaId)
                ->where(function ($query) use ($tecnico, $data) {
                    $query->where('tecnico_id', $tecnico->id);

                    if (isset($data['oficina_id'])) {
                        $query->orWhere('oficina_id', $data['oficina_id']);
                    }
                })
                ->first();

            if (!$pericia) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.pericia_not_found'),
                ], 404);
            }

            if ($pericia->status !== PericiaStatusEnum::ABERTA) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.pericia_unavailable'),
                ], 403);
            }

            $oficina = Oficina::find($data['oficina_id'] ?? $pericia->oficina_id);
            $servico = Servico::find(
                isset($data['servico_id']) ?
                $data['servico_id']
                : null) ?? $pericia->servico;

            DB::beginTransaction();

            if (!$servico) {
                $servico = Servico::create([
                    'tecnico_label' => $oficina->nome_fantasia,
                    'oficina_id' => $oficina->id,
                    'tecnico_id' => $tecnico->id,
                    'criado_por_usuario_id' => $user->id,
                    'data_inicio' => now()->toDateString(),
                    'status' => ServicoStatusEnum::EM_EXECUCAO->value,
                    'disponivel_para_todos' => false,
                    'pericia_completa' => 1,
                    'quantidade_tipo' => 'carros',
                    'quantidade' => 1,
                    'valor_total' => 0,
                    'data_prevista_chegada' => now()->toDateString(),
                    'horario_previsto_chegada' => now()->format('H:i'),
                    'moeda' => 'EUR',
                    'aceito_em' => now(),
                ]);
            } else {
                if ($servico->tecnico_id !== $tecnico->id) {
                    DB::rollBack();

                    return response()->json([
                        'success' => false,
                        'message' => __('main.service_start_error'),
                    ], 403);
                }

                $servico->update([
                    'tecnico_label' => $oficina->nome_fantasia,
                    'status' => ServicoStatusEnum::EM_EXECUCAO->value,
                ]);
            }

            ServicoLog::create([
                'servico_id' => $servico->id,
                'pericia_id' => $pericia->id,
                'tecnico_id' => $tecnico->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_INICIADO_VIA_PERICIA,
                'descricao' => 'Carro iniciado (execução vinculada à perícia)',
                'payload' => [
                    'preco_sugerido' => $data['preco_sugerido'] ?? null,
                    'valor_pericia' => $data['valor_pericia'] ?? null,
                ],
            ]);

            $veiculo = ServicoVeiculo::create([
                'servico_id' => $servico->id,
                'placa' => $pericia->placa,
                'chassi' => $pericia->chassi,
                'marca_modelo' => $pericia->marca_modelo,
            ]);

            $pericia->update([
                'servico_id' => $servico->id,
                'status' => PericiaStatusEnum::EM_EXECUCAO->value,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_start_success'),
                'data' => $servico,
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao iniciar serviço via perícia completa', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_start_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function saveExecution(Request $request, int $id)
    {
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $servico = Servico::with(['primeiroVeiculo', 'periciaEmExecucao'])
                ->where('id', $id)
                ->where('tecnico_id', $tecnico->id)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            DB::beginTransaction();

            $veiculo = $servico->primeiroVeiculo;

            // Reparos
            $fotosReparos = $this->salvarFotosReparos($request->file('fotos_reparo', []), $veiculo->id);
            $uploadedFotosReparosPaths = $fotosReparos;
            $reparosExecucaoJson = json_decode($request->input('reparos_execucao', '[]'), true);
            $reparosAtuais = $veiculo->reparos_execucao ?? [];
            $reparos = $this->normalizeReparos($reparosExecucaoJson, $reparosAtuais);
            $fotosReparoRemover = json_decode($request->input('fotos_reparo_remover', '[]'), true);
            $remocoesPorPeca = [];

            foreach ($fotosReparoRemover as $remocao) {
                $remocoesPorPeca[$remocao['partId']][] = $remocao['path'];
            }

            foreach ($reparos as &$reparo) {
                $peca = $reparo['peca'];

                $fotos = array_merge(
                    $reparo['fotos'] ?? [],
                    $fotosReparos[$peca] ?? []
                );

                if (isset($remocoesPorPeca[$peca])) {
                    $fotos = array_diff(
                        $fotos,
                        $remocoesPorPeca[$peca]
                    );
                }

                $reparo['fotos'] = array_values($fotos);
            }

            $veiculo->update([
                'reparos_execucao' => $reparos,
                'finalizado_em' => $request->boolean('finalizar') ? now() : null,
            ]);

            if ($request->boolean('finalizar')) {
                $servico->update([
                    'status' => ServicoStatusEnum::FINALIZADO->value,
                ]);

                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'tecnico_id' => $tecnico->id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_FINALIZADO,
                    'descricao' => 'Técnico finalizou a execução do serviço',
                ]);

                if ($servico->periciaEmExecucao) {
                    $servico->periciaEmExecucao->update([
                        'status' => PericiaStatusEnum::CONCLUIDA->value,
                    ]);
                }
            }

            // Lógica de remoção de fotos
            if (! empty($fotosReparoRemover)) {
                $this->removerFotosReparos($fotosReparoRemover);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $request->boolean('finalizar')
                    ? __('main.service_execution_finish_success')
                    : __('main.service_execution_progress_success'),
                'data' => $servico->fresh()->load([
                    'oficina:id,nome_fantasia',
                    'primeiroVeiculo',
                    'periciaEmExecucao',
                ]),
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotosReparos($uploadedFotosReparosPaths);

            Log::error('Erro ao salvar execução', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_execution_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function onlyFinishExecution(int $id)
    {
        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $servico = Servico::with(['primeiroVeiculo', 'periciaEmExecucao'])
                ->where('id', $id)
                ->where('tecnico_id', $tecnico->id)
                ->where('status', ServicoStatusEnum::EM_EXECUCAO->value)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            DB::beginTransaction();

            $veiculo = $servico->primeiroVeiculo;

            $veiculo->update([
                'finalizado_em' => now(),
            ]);

            $servico->update([
                'status' => ServicoStatusEnum::FINALIZADO->value,
            ]);

            ServicoLog::create([
                'servico_id' => $servico->id,
                'tecnico_id' => $tecnico->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_FINALIZADO,
                'descricao' => 'Técnico finalizou a execução do serviço',
            ]);

            if ($servico->periciaEmExecucao) {
                $servico->periciaEmExecucao->update([
                    'status' => PericiaStatusEnum::CONCLUIDA->value,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_execution_finish_success'),
                'data' => $servico->fresh()->load([
                    'oficina:id,nome_fantasia',
                    'primeiroVeiculo',
                    'periciaEmExecucao',
                ]),
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao salvar execução', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_execution_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function salvarFotosPericia(?array $files, int $periciaId, bool $periciaCompleta = false): array
    {
        $paths = [];

        $folder = $periciaCompleta ? 'fotos-pericia-completa' : 'fotos';

        foreach ($files as $tipo => $file) {
            if (! $file) {
                continue;
            }

            $path = $file->store("pericias/{$periciaId}/{$folder}", 'public');
            $paths[$tipo] = $path;
        }

        return $paths;
    }

    private function salvarFotosReparos(array $fotosReparos, int $itemId, bool $pericia = false): array
    {
        $result = [];
        $pathSaveFile = $pericia ? 'pericias' : 'veiculos';

        foreach ($fotosReparos as $peca => $files) {
            foreach ($files as $file) {
                if (!$file) {
                    continue;
                }

                $path = $file->store("{$pathSaveFile}/{$itemId}/reparos/{$peca}", 'public');

                $result[$peca][] = $path;
            }
        }

        return $result;
    }

    private function removerFotos(array $paths): void
    {
        foreach ($paths as $path) {
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function removerFotosReparos(array $fotosReparos): void
    {
        foreach ($fotosReparos as $peca => $files) {
            if (!is_array($files)) {
                continue;
            }

            foreach ($files as $path) {
                if ($path && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }
    }

    private function normalizeReparos(array $reparos, array $reparosAtuais = []): array
    {
        $reparosIndexados = collect($reparosAtuais)
            ->keyBy('peca')
            ->toArray();

        return array_map(function ($reparo) use ($reparosIndexados) {
            $peca = $reparo['peca'] ?? null;

            $atual = $reparosIndexados[$peca] ?? [];

            return [
                'peca' => $peca,
                'tipoReparo' => $reparo['tipoReparo'] ?? 'SEM_DANO',
                'quantidadeAmassados' => $reparo['quantidadeAmassados'] ?? 0,
                'quantidadeImpactosMaior25' => $reparo['quantidadeImpactosMaior25'] ?? 0,
                'quantidadeImpactosMenor25' => $reparo['quantidadeImpactosMenor25'] ?? 0,
                'tamanhoAmassado' => $reparo['tamanhoAmassado'] ?? null,
                'coeficiente' => $reparo['coeficiente'] ?? 0,
                'observacoes' => $reparo['observacoes'] ?? '',
                'fotos' => $atual['fotos'] ?? [],
            ];
        }, $reparos);
    }

    public function generatePdf(int $id)
    {
        try {
            $servico = Servico::with(['tecnico', 'oficina', 'primeiroVeiculo'])->find($id);

            if (! $servico) {
                return response()->json(['success' => false, 'message' => 'Serviço não encontrado'], 404);
            }

            $pdf = Pdf::loadView('pdf.executado', ['servico' => $servico]);

            return $pdf->download("relatorio-executado-{$servico->id}.pdf");
        } catch (Exception $e) {
            Log::error('Erro ao gerar PDF', ['error' => $e->getMessage()]);

            return response()->json(['success' => false, 'message' => 'Erro ao gerar PDF'], 500);
        }
    }
}
