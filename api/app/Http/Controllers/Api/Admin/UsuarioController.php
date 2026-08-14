<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\DeleteUsuarioRequest;
use App\Http\Requests\Api\Admin\StoreUsuarioRequest;
use App\Http\Requests\Api\Admin\ToggleUsuarioStatusRequest;
use App\Http\Requests\Api\Admin\UpdateUsuarioPasswordRequest;
use App\Http\Requests\Api\Admin\UpdateUsuarioRequest;
use App\Http\Resources\Api\Admin\UsuarioResource;
use App\Http\Services\AdminUsuarioService;
use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    public function __construct(
        private readonly AdminUsuarioService $usuarioService,
    ) {
    }

    public function listSelecao(Request $request)
    {
        $tipo = strtoupper((string) $request->input('tipo'));

        if (!in_array($tipo, ['TECNICO', 'OFICINA'])) {
            return response()->json(['message' => __('main.usuario_tipo_invalido')], 422);
        }

        if ($tipo === 'TECNICO') {
            $itens = Tecnico::query()
                ->select('id', 'usuario_id', 'nome_completo')
                ->orderBy('nome_completo')
                ->get()
                ->map(fn ($tecnico) => [
                    'id' => $tecnico->id,
                    'userId' => $tecnico->usuario_id,
                    'name' => $tecnico->nome_completo,
                ]);
        } else {
            $itens = Oficina::query()
                ->select('id', 'usuario_id', 'nome_fantasia', 'razao_social')
                ->orderByRaw("COALESCE(NULLIF(razao_social, ''), nome_fantasia) ASC")
                ->get()
                ->map(fn ($oficina) => [
                    'id' => $oficina->id,
                    'userId' => $oficina->usuario_id,
                    'name' => $oficina->razao_social ?: $oficina->nome_fantasia,
                ]);
        }

        return response()->json(['data' => $itens]);
    }

    public function index(Request $request)
    {
        $usuarios = User::query()
            ->select('usuarios.*')
            ->leftJoin('oficinas', 'oficinas.usuario_id', '=', 'usuarios.id')
            ->leftJoin('tecnicos', 'tecnicos.usuario_id', '=', 'usuarios.id')
            ->with(['oficina', 'tecnico'])
            ->whereIn('usuarios.perfil', ['OFICINA', 'TECNICO'])
            ->where(function ($query) {
                $query->whereNull('usuarios.nome')
                    ->orWhere('usuarios.nome', '!=', '_TEMP');
            })
            ->when($request->input('perfil'), function ($query, $perfil) {
                $query->where('usuarios.perfil', $perfil);
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('usuarios.ativo', $status === 'ativo');
            })
            ->when($request->input('pais'), function ($query, $pais) {
                $query->where(function ($sub) use ($pais) {
                    $sub->where('oficinas.pais', $pais)
                        ->orWhere('tecnicos.pais_atual', $pais);
                });
            })
            ->when($request->input('cidade'), function ($query, $cidade) {
                $query->where(function ($sub) use ($cidade) {
                    $sub->where('oficinas.cidade', 'like', "%{$cidade}%")
                        ->orWhere('tecnicos.endereco_cidade', 'like', "%{$cidade}%");
                });
            })
            ->when($request->input('busca'), function ($query, $busca) {
                $query->where(function ($sub) use ($busca) {
                    $sub->where('usuarios.email', 'like', "%{$busca}%")
                        ->orWhere('oficinas.cnpj', 'like', "%{$busca}%")
                        ->orWhere('oficinas.nome_fantasia', 'like', "%{$busca}%")
                        ->orWhere('oficinas.nome_responsavel', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.cpf', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.cnpj', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.nome_completo', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.apelido', 'like', "%{$busca}%");
                });
            })
            ->orderByRaw("
                CASE usuarios.perfil
                    WHEN 'TECNICO' THEN tecnicos.nome_completo
                    WHEN 'OFICINA' THEN COALESCE(NULLIF(oficinas.nome_fantasia, ''), oficinas.razao_social)
                END ASC
            ")
            ->paginate($request->integer('per_page', 20));

        return UsuarioResource::collection($usuarios);
    }

    public function store(StoreUsuarioRequest $request)
    {
        $usuario = $this->usuarioService->create($request->validated());

        $messageKey = $request->input('perfil') === 'TECNICO'
            ? 'main.admin_tecnico_created_success'
            : 'main.admin_oficina_created_success';

        return response()->json([
            'message' => __($messageKey),
            'data' => new UsuarioResource($usuario),
        ], 201);
    }

    public function show(int $id)
    {
        $usuario = User::with(['oficina', 'tecnico'])->find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        return response()->json(['data' => new UsuarioResource($usuario)]);
    }

    public function toggleStatus(ToggleUsuarioStatusRequest $request, int $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        try {
            $this->usuarioService->toggleStatus(
                $usuario,
                $request->user(),
                $request->validated('senha'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'message' => __('main.admin_password_invalid'),
                'errors' => $e->errors(),
            ], 403);
        }

        $usuario->refresh();

        return response()->json([
            'message' => $usuario->ativo
                ? __('main.admin_user_activated_success')
                : __('main.admin_user_deactivated_success'),
            'data' => new UsuarioResource($usuario->fresh(['oficina', 'tecnico'])),
        ]);
    }

    public function update(UpdateUsuarioRequest $request, int $id)
    {
        $usuario = User::with(['oficina', 'tecnico'])->find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $data = $request->validated();

        $whatsapp = $data['codigo_pais_telefone'] . $data['numero_telefone'];

        if (User::where('whatsapp', $whatsapp)->where('id', '!=', $usuario->id)->exists()) {
            return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
        }

        $usuario->update([
            'email' => strtolower($data['email']),
            'codigo_pais_telefone' => $data['codigo_pais_telefone'],
            'numero_telefone' => $data['numero_telefone'],
            'iso_pais_telefone' => $data['iso_pais_telefone'] ?? $usuario->iso_pais_telefone,
            'whatsapp' => $whatsapp,
            'ativo' => $data['status'],
        ]);

        $telefoneSecundario = [
            'telefone_secundario' => $data['telefone_secundario'] ?? null,
            'codigo_pais_telefone_secundario' => !empty($data['telefone_secundario'])
                ? ($data['codigo_pais_telefone_secundario'] ?? null)
                : null,
            'iso_pais_telefone_secundario' => !empty($data['telefone_secundario'])
                ? ($data['iso_pais_telefone_secundario'] ?? null)
                : null,
        ];

        if ($usuario->perfil === 'TECNICO' && $usuario->tecnico) {
            $usuario->tecnico->update(array_merge([
                'nome_completo' => $data['nome_completo'] ?? $usuario->tecnico->nome_completo,
                'apelido' => array_key_exists('apelido', $data) ? $data['apelido'] : $usuario->tecnico->apelido,
                'cpf' => $data['documento'] ?? $usuario->tecnico->cpf,
                'endereco_rua' => $data['rua'] ?? $usuario->tecnico->endereco_rua,
                'endereco_numero' => $data['numero'] ?? $usuario->tecnico->endereco_numero,
                'endereco_complemento' => $data['complemento'] ?? $usuario->tecnico->endereco_complemento,
                'endereco_cidade' => $data['cidade'],
                'endereco_estado' => $data['estado'] ?? $usuario->tecnico->endereco_estado,
                'endereco_cep' => $data['cep'] ?? $usuario->tecnico->endereco_cep,
                'pais_atual' => $data['pais'] ?? $usuario->tecnico->pais_atual,
            ], $telefoneSecundario));
        }

        if ($usuario->perfil === 'OFICINA' && $usuario->oficina) {
            $usuario->oficina->update(array_merge([
                'nome_fantasia' => $data['nome_fantasia']
                    ?? $data['nome_completo']
                    ?? $usuario->oficina->nome_fantasia,
                'nome_responsavel' => $data['nome_responsavel'] ?? $usuario->oficina->nome_responsavel,
                'razao_social' => $data['razao_social'] ?? $usuario->oficina->razao_social,
                'cnpj' => $data['documento'] ?? $usuario->oficina->cnpj,
                'email_secundario' => isset($data['email_secundario'])
                    ? ($data['email_secundario'] ? strtolower($data['email_secundario']) : null)
                    : $usuario->oficina->email_secundario,
                'rua' => $data['rua'] ?? $usuario->oficina->rua,
                'numero' => $data['numero'] ?? $usuario->oficina->numero,
                'complemento' => $data['complemento'] ?? $usuario->oficina->complemento,
                'cidade' => $data['cidade'],
                'estado' => $data['estado'] ?? $usuario->oficina->estado,
                'cep' => $data['cep'] ?? $usuario->oficina->cep,
                'pais' => $data['pais'] ?? $usuario->oficina->pais,
                'prazo_pagamento' => $data['prazo_pagamento'] ?? $usuario->oficina->prazo_pagamento,
            ], $telefoneSecundario));
        }

        return response()->json([
            'message' => __('main.admin_user_updated_success'),
            'data' => new UsuarioResource($usuario->fresh(['oficina', 'tecnico'])),
        ]);
    }

    public function updatePassword(UpdateUsuarioPasswordRequest $request, int $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $this->usuarioService->updatePassword($usuario, $request->validated('senha'));

        return response()->json([
            'message' => __('main.admin_user_password_updated_success'),
        ]);
    }

    public function destroy(DeleteUsuarioRequest $request, int $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $admin = $request->user();

        try {
            $this->usuarioService->deleteWithAdminPassword(
                $usuario,
                $admin,
                $request->validated('senha'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'message' => __('main.admin_password_invalid'),
                'errors' => $e->errors(),
            ], 403);
        }

        return response()->json([
            'message' => __('main.account_deleted_success'),
        ]);
    }
}
