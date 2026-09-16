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
                ->select('id', 'usuario_id', 'nome_fantasia', 'razao_social', 'rua', 'numero', 'cidade', 'cep', 'estado', 'pais')
                ->orderByRaw("COALESCE(NULLIF(razao_social, ''), nome_fantasia) ASC")
                ->get()
                ->map(fn ($oficina) => [
                    'id' => $oficina->id,
                    'userId' => $oficina->usuario_id,
                    'name' => $oficina->razao_social ?: $oficina->nome_fantasia,
                    'canRequestTechnician' => $oficina->podeSolicitarTecnico(),
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
                    if (is_numeric($busca)) {
                        $sub->orWhere('usuarios.id', (int) $busca);
                    }

                    $sub->orWhere('usuarios.email', 'like', "%{$busca}%")
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
        $userUpdates = [];

        if (array_key_exists('email', $data)) {
            $userUpdates['email'] = strtolower($data['email']);
        }

        $phoneChanged = array_key_exists('codigo_pais_telefone', $data)
            || array_key_exists('numero_telefone', $data);

        if ($phoneChanged) {
            $countryCode = $data['codigo_pais_telefone'] ?? $usuario->codigo_pais_telefone;
            $phoneNumber = $data['numero_telefone'] ?? $usuario->numero_telefone;
            $whatsapp = $countryCode . $phoneNumber;

            if (User::where('whatsapp', $whatsapp)->where('id', '!=', $usuario->id)->exists()) {
                return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
            }

            $userUpdates['codigo_pais_telefone'] = $countryCode;
            $userUpdates['numero_telefone'] = $phoneNumber;
            $userUpdates['whatsapp'] = $whatsapp;
        }

        if (array_key_exists('iso_pais_telefone', $data)) {
            $userUpdates['iso_pais_telefone'] = $data['iso_pais_telefone'];
        }

        if (array_key_exists('telefone_titular', $data)) {
            $userUpdates['telefone_titular'] = $data['telefone_titular'];
        }

        if (array_key_exists('status', $data)) {
            $userUpdates['ativo'] = $data['status'];
        }

        if ($userUpdates) {
            $usuario->update($userUpdates);
        }

        $secondaryPhoneKeys = [
            'telefone_secundario',
            'codigo_pais_telefone_secundario',
            'iso_pais_telefone_secundario',
            'telefone_secundario_titular',
        ];
        $secondaryPhoneChanged = collect($secondaryPhoneKeys)->contains(
            fn ($key) => array_key_exists($key, $data)
        );

        $telefoneSecundario = [];
        if ($secondaryPhoneChanged) {
            $secondaryNumber = $data['telefone_secundario'] ?? null;
            $telefoneSecundario = [
                'telefone_secundario' => $secondaryNumber,
                'codigo_pais_telefone_secundario' => !empty($secondaryNumber)
                    ? ($data['codigo_pais_telefone_secundario'] ?? null)
                    : null,
                'iso_pais_telefone_secundario' => !empty($secondaryNumber)
                    ? ($data['iso_pais_telefone_secundario'] ?? null)
                    : null,
                'telefone_secundario_titular' => !empty($secondaryNumber)
                    ? ($data['telefone_secundario_titular'] ?? null)
                    : null,
            ];
        }

        if ($usuario->perfil === 'TECNICO' && $usuario->tecnico) {
            $tecnicoUpdates = $telefoneSecundario;
            $map = [
                'nome_completo' => 'nome_completo',
                'apelido' => 'apelido',
                'documento' => 'cpf',
                'nome_fantasia_empresa' => 'nome_fantasia_empresa',
                'razao_social_empresa' => 'razao_social_empresa',
                'cnpj_empresa' => 'cnpj',
                'rua' => 'endereco_rua',
                'numero' => 'endereco_numero',
                'complemento' => 'endereco_complemento',
                'cidade' => 'endereco_cidade',
                'estado' => 'endereco_estado',
                'cep' => 'endereco_cep',
                'pais' => 'pais_atual',
            ];

            foreach ($map as $input => $column) {
                if (array_key_exists($input, $data)) {
                    $tecnicoUpdates[$column] = $data[$input];
                }
            }

            foreach (['idiomas', 'banco_nome', 'banco_iban', 'banco_swift', 'banco_endereco'] as $field) {
                if (array_key_exists($field, $data)) {
                    $tecnicoUpdates[$field] = $data[$field];
                }
            }

            if ($tecnicoUpdates) {
                $usuario->tecnico->update($tecnicoUpdates);
            }
        }

        if ($usuario->perfil === 'OFICINA' && $usuario->oficina) {
            $oficinaUpdates = $telefoneSecundario;
            $map = [
                'nome_fantasia' => 'nome_fantasia',
                'nome_responsavel' => 'nome_responsavel',
                'razao_social' => 'razao_social',
                'documento' => 'cnpj',
                'rua' => 'rua',
                'numero' => 'numero',
                'complemento' => 'complemento',
                'cidade' => 'cidade',
                'estado' => 'estado',
                'cep' => 'cep',
                'pais' => 'pais',
                'prazo_pagamento' => 'prazo_pagamento',
            ];

            foreach ($map as $input => $column) {
                if (array_key_exists($input, $data)) {
                    $oficinaUpdates[$column] = $data[$input];
                }
            }

            if (array_key_exists('email_secundario', $data)) {
                $oficinaUpdates['email_secundario'] = $data['email_secundario']
                    ? strtolower($data['email_secundario'])
                    : null;
            }

            if ($oficinaUpdates) {
                $usuario->oficina->update($oficinaUpdates);
            }
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
