<?php

namespace App\Http\Services;

use App\Enums\ServicoLogTipoEnum;
use App\Enums\ServicoStatusEnum;
use App\Models\DispositivoUsuario;
use App\Models\Oficina;
use App\Models\Servico;
use App\Models\ServicoLog;
use App\Models\Tecnico;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CriarServicoService
{
    private const LOCALE_MAP = [
        'pt-BR' => 'pt',
        'fr-FR' => 'fr',
        'it-IT' => 'it',
    ];

    public function __construct(
        private readonly PushNotificationService $pushNotificationService,
    ) {
    }

    /**
     * @param  array{
     *     moeda?: string,
     *     observacoes?: ?string,
     *     data_inicio?: ?string,
     *     data_fim?: ?string,
     *     quantidade?: int|string|null,
     *     quantidade_tipo?: ?string,
     *     descricaoLog?: string
     * }  $dados
     * @return array{servico: Servico, possuiPreferidos: bool}
     */
    public function criar(Oficina $oficina, User $criadoPor, array $dados = []): array
    {
        if (! $oficina->podeSolicitarTecnico()) {
            throw ValidationException::withMessages([
                'oficina_id' => [__('main.service_workshop_address_required')],
            ]);
        }

        $tecnicosPreferidos = $oficina->tecnicos_preferidos ?? [];
        $possuiPreferidos = ! empty($tecnicosPreferidos);

        $servico = DB::transaction(function () use ($oficina, $criadoPor, $dados, $tecnicosPreferidos, $possuiPreferidos) {
            $servico = Servico::create([
                'tecnico_label' => $oficina->cidade,
                'oficina_id' => $oficina->id,
                'criado_por_usuario_id' => $criadoPor->id,
                'data_inicio' => $dados['data_inicio'] ?? null,
                'data_fim' => $dados['data_fim'] ?? null,
                'quantidade_tipo' => $dados['quantidade_tipo'] ?? null,
                'quantidade' => $dados['quantidade'] ?? null,
                'observacoes' => $dados['observacoes'] ?? null,
                'status' => ServicoStatusEnum::EM_BREVE,
                'tecnicos_preferidos_notificados' => $tecnicosPreferidos,
                'disponivel_para_todos' => ! $possuiPreferidos,
                'liberado_para_todos_em' => $possuiPreferidos ? now()->addHours(1) : now(),
                'moeda' => $dados['moeda'] ?? 'EUR',
            ]);

            ServicoLog::create([
                'servico_id' => $servico->id,
                'oficina_id' => $oficina->id,
                'tipo' => ServicoLogTipoEnum::SERVICO_CRIADO,
                'descricao' => $dados['descricaoLog'] ?? 'Oficina criou o serviço',
                'payload' => [
                    'moeda' => $servico->moeda,
                    'disponivel_para_todos' => $servico->disponivel_para_todos,
                    'tecnicos_preferidos_notificados' => $servico->tecnicos_preferidos_notificados,
                    'cidade_oficina' => $oficina->cidade,
                    'pais_oficina' => $oficina->pais,
                    'criado_por_admin' => $criadoPor->perfil === 'ADMIN',
                ],
            ]);

            return $servico;
        });

        $this->notificarTecnicos($tecnicosPreferidos, $servico);

        return [
            'servico' => $servico,
            'possuiPreferidos' => $possuiPreferidos,
        ];
    }

    private function notificarTecnicos(array $tecnicosPreferidos, Servico $servico): void
    {
        try {
            $tecnicosQuery = Tecnico::query();

            if (! empty($tecnicosPreferidos)) {
                $tecnicosQuery->whereIn('id', $tecnicosPreferidos);
            }

            $devices = DispositivoUsuario::whereIn('usuario_id', $tecnicosQuery->pluck('usuario_id'))
                ->get(['token', 'idioma'])
                ->unique('token')
                ->filter(fn ($d) => ! empty($d->token));

            foreach ($devices as $device) {
                $locale = self::LOCALE_MAP[$device->idioma] ?? 'pt';

                $this->pushNotificationService->sendToToken($device->token, [
                    'title' => __('notifications.service_created_title', [], $locale),
                    'body' => __('notifications.service_created_body', [], $locale),
                    'data' => [
                        'type' => 'SERVICE_CREATED',
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
}
