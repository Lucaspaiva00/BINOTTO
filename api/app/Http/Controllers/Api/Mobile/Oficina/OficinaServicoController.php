<?php

namespace App\Http\Controllers\Api\Mobile\Oficina;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoLogTipoEnum;
use App\Enums\ServicoStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Services\CriarServicoService;
use App\Http\Services\PushNotificationService;
use App\Models\DispositivoUsuario;
use App\Models\Pericia;
use App\Models\Servico;
use App\Models\ServicoLog;
use App\Models\ServicoVeiculo;
use App\Models\Tecnico;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;

class OficinaServicoController extends Controller
{
    private PushNotificationService $pushNotificationService;
    private CriarServicoService $criarServicoService;

    private $localeMap = [
        'pt-BR' => 'pt',
        'fr-FR' => 'fr',
        'it-IT' => 'it',
    ];

    public function __construct(
        PushNotificationService $pushNotificationService,
        CriarServicoService $criarServicoService,
    ) {
        $this->pushNotificationService = $pushNotificationService;
        $this->criarServicoService = $criarServicoService;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $oficina = $user->oficina;

        $date = $request->input('date');

        $servicos = Servico::with(['tecnico', 'primeiroVeiculo'])
            ->where('oficina_id', $oficina?->id)
            ->when($date, function ($query) use ($date) {
                $query->whereDate('data_inicio', $date);
            })
            ->orderByRaw("
                CASE status
                    WHEN '".ServicoStatusEnum::AGUARDANDO->value."' THEN 0
                    WHEN '".ServicoStatusEnum::EM_EXECUCAO->value."' THEN 1
                    WHEN '".ServicoStatusEnum::ACEITO->value."' THEN 2
                    WHEN '".ServicoStatusEnum::EM_BREVE->value."' THEN 3
                    WHEN '".ServicoStatusEnum::CONCLUIDO->value."' THEN 4
                    WHEN '".ServicoStatusEnum::FINALIZADO->value."' THEN 5
                    WHEN '".ServicoStatusEnum::CANCELADO->value."' THEN 6
                    ELSE 99
                END
            ")
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $servicos,
        ]);
    }

    public function agendaCalendar(Request $request)
    {
        $user = auth()->user();
        $oficina = $user->oficina;

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        $servicos = Servico::with(['tecnico', 'primeiroVeiculo'])
            ->where('oficina_id', $oficina?->id)
            ->whereBetween('data_inicio', [$startOfMonth, $endOfMonth])
            ->get(['data_inicio', 'status']);

        // Retornando agrupado por data
        $servicesGrouped = $servicos->groupBy(function ($item) {
            return Carbon::parse($item->data_inicio)->format('Y-m-d');
        })->map(function ($items) {
            return $items->map(function ($item) {
                return [
                    'status' => $item->status,
                ];
            })->values();
        });

        return response()->json([
            'success' => true,
            'data' => $servicesGrouped,
        ]);
    }

    public function listPendentes(Request $request)
    {
        $user = auth()->user();
        $oficina = $user->oficina;

        $query = Servico::with(['tecnico', 'primeiroVeiculo'])
            ->where('oficina_id', $oficina?->id)
            ->whereNotIn('status', [
                ServicoStatusEnum::CONCLUIDO,
                ServicoStatusEnum::CANCELADO,
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $query->orderByDesc('created_at');


        return response()->json([
            'success' => true,
            'data' => $query->paginate(10),
        ]);
    }

    public function listHistorico(Request $request)
    {
        $user = auth()->user();
        $oficina = $user->oficina;

        $query = Servico::with(['tecnico', 'primeiroVeiculo'])->where('oficina_id', $oficina?->id)
            ->whereIn('status', [
                ServicoStatusEnum::CONCLUIDO,
                ServicoStatusEnum::CANCELADO,
            ]);

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

    public function show(int $id)
    {
        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            $servico = Servico::with([
                'tecnico',
                'primeiroVeiculo',
                'ultimaPericia'
            ])->where('id', $id)
                ->where('oficina_id', $oficina?->id)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            $pericia = $servico->ultimaPericia;

            $response = $servico->toArray();
            if ($pericia) {
                $response['tipo_pericia'] = $pericia->tipo;
                $response['placa'] = $pericia->placa;
                $response['chassi'] = $pericia->chassi;
                $response['marca_modelo'] = $pericia->marca_modelo;
                $response['fotos'] = $pericia->fotos;
                $response['fotos_pericia_completa'] = $pericia->fotos_pericia_completa;
                $response['reparos_necessarios'] = $pericia->reparos_necessarios;
                $response['fotos_reparos'] = $this->extrairFotosReparos($pericia->reparos_necessarios);
                $response['preco_sugerido'] = $pericia->preco_sugerido;
                $response['valor_pericia'] = $pericia->valor_pericia;
            }

            return response()->json([
                'success' => true,
                'data' => $response,
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
    private function extrairFotosReparos(?array $reparos): array
    {
        $result = [];
        if (!$reparos) return $result;
        foreach ($reparos as $reparo) {
            $peca = $reparo['peca'] ?? null;
            if ($peca && isset($reparo['fotos']) && is_array($reparo['fotos'])) {
                $result[$peca] = $reparo['fotos'];
            }
        }
        return $result;
    }

    public function create(Request $request)
    {
        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            if (! $oficina) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.oficina_not_found'),
                ], 422);
            }

            $resultado = $this->criarServicoService->criar($oficina, $user, [
                'moeda' => $request->moeda ?? 'EUR',
            ]);

            return response()->json([
                'success' => true,
                'message' => __('main.service_created_success'),
                'possuiPreferidos' => $resultado['possuiPreferidos'],
                'data' => $resultado['servico'],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?: __('main.service_address_required'),
            ], 422);
        } catch (Exception $e) {
            Log::error('Erro ao criar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_create_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        $uploadedPaths = [];
        $uploadedFotosPericiaCompleta = [];
        $uploadedFotosReparos = [];

        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            $servico = Servico::where('id', $id)
                ->where('oficina_id', $oficina?->id)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            if ($servico->status !== ServicoStatusEnum::EM_BREVE) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_editable'),
                ], 400);
            }

            DB::beginTransaction();

            $servico->update([
                'data_inicio' => $request->data_inicio ?? $servico->data_inicio,
                'data_fim' => $request->data_fim ?? $servico->data_fim,
                'quantidade_tipo' => $request->quantidade_tipo ?? $servico->quantidade_tipo,
                'quantidade' => $request->quantidade ?? $servico->quantidade,
                'moeda' => $request->moeda,
                'valor_total' => $servico->valor_total,
                'pericia_completa' => $request->pericia_completa,
                'observacoes' => $request->observacoes ?? $servico->observacoes,
                'status' => ServicoStatusEnum::AGUARDANDO,
            ]);

            // Cria a perícia do serviço (ainda não existe nenhuma neste momento)
            $pericia = new Pericia();
            $pericia->tecnico_id = $servico->tecnico_id;
            $pericia->oficina_id = $servico->oficina_id;
            $pericia->servico_id = $servico->id;
            $pericia->status = PericiaStatusEnum::ABERTA;
            $pericia->moeda = $servico->moeda;
            $pericia->tipo = $request->pericia_completa ? 'completa' : 'simples';
            $pericia->preco_sugerido = !$request->pericia_completa ? $request->valor_total : null;
            $pericia->valor_pericia = $request->pericia_completa ? $request->valor_total : null;
            $pericia->save();

            // Processa as fotos
            if ($request->hasFile('fotos')) {
                $uploadedPaths = $this->salvarFotosPericia($request->file('fotos'), $pericia->id);
                $pericia->fotos = $uploadedPaths;
            }

            if ($request->hasFile('fotos_pericia_completa')) {
                $uploadedFotosPericiaCompleta = $this->salvarFotosPericiaCompleta(
                    $request->file('fotos_pericia_completa'),
                    $pericia->id
                );
                $pericia->fotos_pericia_completa = $uploadedFotosPericiaCompleta;
            }

            // Reparos
            $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);

            if ($request->hasFile('fotos_reparos')) {
                $uploadedFotosReparos = $this->salvarFotosReparos($request->file('fotos_reparos'), $pericia->id);
            }

            $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson);

            foreach ($reparosNecessarios as &$reparo) {
                $peca = $reparo['peca'];
                $reparo['fotos'] = $uploadedFotosReparos[$peca] ?? [];
            }

            $pericia->reparos_necessarios = $reparosNecessarios;

            // Salva novamente com as fotos e reparos
            $pericia->save();

            ServicoLog::create([
                'servico_id' => $servico->id,
                'pericia_id' => $pericia->id,
                'oficina_id' => $oficina?->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_ATUALIZADO,
                'descricao' => 'Oficina atualizou os dados do serviço',
                'payload' => [
                    'data_inicio' => $servico->data_inicio,
                    'data_fim' => $servico->data_fim,
                    'quantidade_tipo' => $servico->quantidade_tipo,
                    'carros_previstos' => $servico->quantidade,
                    'moeda' => $servico->moeda,
                    'valor_total' => $servico->valor_total,
                    'pericia_completa' => (bool) $servico->pericia_completa,
                    'observacoes' => $servico->observacoes,
                    'quantidade_fotos' => count($uploadedPaths) + count($uploadedFotosPericiaCompleta),
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.service_updated_success'),
                'data' => $servico->fresh(['oficina', 'tecnico', 'pericias']),
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotos($uploadedPaths);
            $this->removerFotos($uploadedFotosPericiaCompleta);
            $this->removerFotosReparos($uploadedFotosReparos);

            Log::error('Erro ao atualizar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_update_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
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


    private function salvarFotosPericia(?array $files, int $periciaId): array
    {
        $paths = [];
        foreach ($files as $tipo => $file) {
            if (!$file) continue;
            $path = $file->store("pericias/{$periciaId}/fotos", 'public');
            $paths[$tipo] = $path;
        }
        return $paths;
    }

    private function salvarFotosPericiaCompleta(?array $files, int $periciaId): array
    {
        $paths = [];
        foreach ($files as $tipo => $file) {
            if (!$file) continue;
            $path = $file->store("pericias/{$periciaId}/fotos-pericia-completa", 'public');
            $paths[$tipo] = $path;
        }
        return $paths;
    }

    private function salvarFotosReparos(array $files, int $periciaId): array
    {
        $result = [];
        foreach ($files as $peca => $fileArray) {
            foreach ($fileArray as $file) {
                if (!$file) continue;
                $path = $file->store("pericias/{$periciaId}/reparos/{$peca}", 'public');
                $result[$peca][] = $path;
            }
        }
        return $result;
    }


    private function normalizeReparos(array $reparos, array $reparosAtuais = []): array
    {
        $reparosIndexados = collect($reparosAtuais)->keyBy('peca')->toArray();
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


    public function confirm(int $id, Request $request)
    {
        try {
            $user = auth()->user();

            $oficina = $user->oficina;

            $request->validate([
                'avaliacao' => 'required|integer|min:1|max:5',
            ]);

            $servico = Servico::with(['tecnico', 'veiculos'])->where('id', $id)
                ->where('oficina_id', $oficina?->id)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            if ($servico->status !== ServicoStatusEnum::FINALIZADO) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_finished'),
                ], 404);
            }

            $servico->update([
                'status' => ServicoStatusEnum::CONCLUIDO,
                'avaliacao' => $request->avaliacao,
                'valor_total' => $request->valor_final,
            ]);

            ServicoLog::create([
                'servico_id' => $servico->id,
                'oficina_id' => $oficina?->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_CONCLUIDO,
                'descricao' => 'Oficina confirmou a conclusão do serviço',
                'payload' => [
                    'avaliacao' => $request->avaliacao,
                    'valor_final' => $request->valor_final,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => __('main.service_completed_success'),
                'data' => $servico->fresh(['tecnico', 'primeiroVeiculo']),
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao concluir o serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_complete_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reject(int $id, Request $request)
    {
        try {
            $user = auth()->user();

            $oficina = $user->oficina;

            $servico = Servico::with(['tecnico', 'veiculos'])->where('id', $id)
                ->where('oficina_id', $oficina?->id)
                ->first();

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            $servico->update([
                'status' => ServicoStatusEnum::RETRABALHO,
            ]);

            ServicoLog::create([
                'servico_id' => $servico->id,
                'oficina_id' => $oficina?->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_ENVIADO_RETRABALHO,
                'descricao' => 'Oficina enviou o serviço para retrabalho',
            ]);

            return response()->json([
                'success' => true,
                'message' => __('main.service_sent_rework_success'),
                'data' => $servico->fresh(['tecnico', 'primeiroVeiculo']),
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao enviar serviço para retrabalho', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_rework_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(int $id)
    {
        try {
            $user = auth()->user();

            $oficina = $user->oficina;

            $servico = DB::transaction(function () use ($id, $oficina) {
                $servico = Servico::where('id', $id)
                    ->where('oficina_id', $oficina?->id)
                    ->whereIn('status', [ServicoStatusEnum::AGUARDANDO->value, ServicoStatusEnum::ACEITO->value])
                    ->lockForUpdate()
                    ->first();

                if (!$servico) {
                    return null;
                }

                if ($servico->status === ServicoStatusEnum::CANCELADO) {
                    return $servico;
                }

                $servico->update([
                    'status' => ServicoStatusEnum::CANCELADO,
                ]);

                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'oficina_id' => $oficina?->id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_CANCELADO,
                    'descricao' => 'Oficina cancelou o serviço',
                ]);

                $periciaAberta = Pericia::where('servico_id', $servico->id)
                    ->where('status', PericiaStatusEnum::ABERTA)
                    ->lockForUpdate()
                    ->latest()
                    ->first();

                if ($periciaAberta) {
                    $periciaAberta->update([
                        'servico_id' => null,
                    ]);
                }

                return $servico;
            });

            if (!$servico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.service_not_found'),
                ], 404);
            }

            // Envia notificação para o tecnico avisando que cancelou
            if ($servico->tecnico) {
                $devices = DispositivoUsuario::where('usuario_id', $servico->tecnico->usuario_id)
                    ->get(['token', 'idioma'])
                    ->unique('token')
                    ->filter(fn($d) => !empty($d->token));

                try {
                    foreach ($devices as $device) {
                        $locale = $this->localeMap[$device->idioma] ?? 'pt';

                        $this->pushNotificationService->sendToToken($device->token, [
                            'title' => __('notifications.service_cancelled_title', [], $locale),
                            'body'  => __('notifications.service_cancelled_body', [], $locale),
                            'data' => [
                                'type' => 'SERVICE_CANCELLED',
                                'target_role' => 'TECHNICIAN',
                                'servico_id' => (string) $servico->id,
                            ],
                        ]);
                    }
                } catch (Exception $e) {
                    Log::error('Erro ao enviar notificação push', [
                        'message' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => __('main.service_cancelled_success'),
                'data' => $servico->fresh(['tecnico', 'primeiroVeiculo']),
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao cancelar serviço', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.service_cancel_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function generatePdf(int $id)
    {
        try {
            $servico = Servico::with(['tecnico', 'oficina', 'primeiroVeiculo'])->find($id);

            if (!$servico) {
                return response()->json(['success' => false, 'message' => __('main.service_not_found')], 404);
            }

            $pdf = Pdf::loadView('pdf.executado', ['servico' => $servico]);
            return $pdf->download("relatorio-executado-{$servico->id}.pdf");
        } catch (Exception $e) {
            Log::error('Erro ao gerar PDF', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => __('main.service_pdf_error')], 500);
        }
    }

    private function salvarFotos(?array $files, int $servicoId): array
    {
        $paths = [];

        foreach ($files as $file) {
            if (!$file) continue;

            $path = $file->store("servicos/{$servicoId}", 'public');
            $paths[] = $path;
        }

        return $paths;
    }

}
