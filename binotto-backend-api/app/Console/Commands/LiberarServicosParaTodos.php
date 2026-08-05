<?php

namespace App\Console\Commands;

use App\Http\Services\PushNotificationService;
use App\Models\DispositivoUsuario;
use App\Models\Servico;
use App\Models\Tecnico;
use Illuminate\Console\Command;

class LiberarServicosParaTodos extends Command
{
    protected $signature = 'servicos:liberar-todos';

    protected $description = 'Libera serviços exclusivos para todos após 1h';

    public function handle(): int
    {
        $servicos = Servico::query()
            ->where('disponivel_para_todos', false)
            ->whereNull('tecnico_id')
            ->where('liberado_para_todos_em', '<=', now())
            ->get();

        foreach ($servicos as $servico) {
            $servico->update([
                'disponivel_para_todos' => true,
            ]);

            $this->notificarTecnicos($servico);
        }

        return self::SUCCESS;
    }

    private function notificarTecnicos(Servico $servico): void
    {
        $preferidos = $servico->tecnicos_preferidos_notificados ?? [];

        $tecnicos = Tecnico::query()
            ->when(!empty($preferidos), function ($q) use ($preferidos) {
                $q->whereNotIn('id', $preferidos);
            })
            ->get();

        $tokens = DispositivoUsuario::whereIn('usuario_id', $tecnicos->pluck('usuario_id'))->pluck('token');

        $push = app(PushNotificationService::class);

        foreach ($tokens as $token) {
            $push->sendToToken($token, [
                'title' => 'Novo serviço disponível',
                'body' => 'Um novo serviço foi criado e pode estar disponível para você.',
                'data' => [
                    'type' => 'SERVICE_CREATED',
                    'target_role' => 'TECHNICIAN',
                    'servico_id' => (string) $servico->id,
                ],
            ]);
        }
    }
}
