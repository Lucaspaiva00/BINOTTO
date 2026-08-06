<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Admin\SuporteChamadoResource;
use App\Http\Resources\Api\Admin\SuporteMensagemResource;
use App\Http\Services\SuporteChamadoService;
use App\Models\SuporteChamado;
use App\Models\User;
use Illuminate\Http\Request;

class SuporteChamadoController extends Controller
{
    public function __construct(
        private readonly SuporteChamadoService $service,
    ) {
    }

    public function index(int $usuarioId)
    {
        $usuario = User::find($usuarioId);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $chamados = SuporteChamado::query()
            ->where('usuario_id', $usuarioId)
            ->with('mensagens')
            ->latest()
            ->get();

        return response()->json([
            'data' => SuporteChamadoResource::collection($chamados),
        ]);
    }

    public function store(Request $request, int $usuarioId)
    {
        $usuario = User::with(['oficina', 'tecnico'])->find($usuarioId);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $data = $request->validate([
            'assunto' => 'required|string|max:255',
            'mensagem' => 'required|string|max:5000',
        ]);

        $chamado = $this->service->create(
            $usuario,
            $request->user(),
            $data['assunto'],
            $data['mensagem'],
        );

        return response()->json([
            'message' => __('main.support_ticket_created_success'),
            'data' => new SuporteChamadoResource($chamado),
        ], 201);
    }

    public function reply(Request $request, int $usuarioId, int $chamadoId)
    {
        $chamado = $this->findChamado($usuarioId, $chamadoId);

        if (!$chamado) {
            return response()->json(['message' => __('main.support_ticket_not_found')], 404);
        }

        $data = $request->validate([
            'mensagem' => 'required|string|max:5000',
        ]);

        $mensagem = $this->service->reply($chamado, $request->user(), $data['mensagem']);

        return response()->json([
            'message' => __('main.support_ticket_replied_success'),
            'data' => new SuporteMensagemResource($mensagem),
        ]);
    }

    public function close(int $usuarioId, int $chamadoId)
    {
        $chamado = $this->findChamado($usuarioId, $chamadoId);

        if (!$chamado) {
            return response()->json(['message' => __('main.support_ticket_not_found')], 404);
        }

        $chamado = $this->service->close($chamado);

        return response()->json([
            'message' => __('main.support_ticket_closed_success'),
            'data' => new SuporteChamadoResource($chamado),
        ]);
    }

    private function findChamado(int $usuarioId, int $chamadoId): ?SuporteChamado
    {
        return SuporteChamado::query()
            ->where('usuario_id', $usuarioId)
            ->with('mensagens')
            ->find($chamadoId);
    }
}
