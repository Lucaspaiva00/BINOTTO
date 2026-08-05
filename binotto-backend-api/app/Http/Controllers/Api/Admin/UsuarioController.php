<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateUsuarioRequest;
use App\Http\Resources\Api\Admin\UsuarioResource;
use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
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
            ->when($request->input('busca'), function ($query, $busca) {
                $query->where(function ($sub) use ($busca) {
                    $sub->where('usuarios.email', 'like', "%{$busca}%")
                        ->orWhere('oficinas.cnpj', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.cpf', 'like', "%{$busca}%")
                        ->orWhere('tecnicos.cnpj', 'like', "%{$busca}%");
                });
            })
            ->orderByRaw("
                CASE usuarios.perfil
                    WHEN 'TECNICO' THEN tecnicos.nome_completo
                    WHEN 'OFICINA' THEN COALESCE(NULLIF(oficinas.razao_social, ''), oficinas.nome_fantasia)
                END ASC
            ")
            ->paginate($request->integer('per_page', 20));

        return UsuarioResource::collection($usuarios);
    }

    public function show(int $id)
    {
        $usuario = User::with(['oficina', 'tecnico'])->find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        return response()->json(['data' => new UsuarioResource($usuario)]);
    }

    public function toggleStatus(int $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        $usuario->update(['ativo' => !$usuario->ativo]);

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
                'nome_completo' => $data['nome_completo'],
                'cpf' => $data['documento'] ?? $usuario->tecnico->cpf,
                'endereco_cidade' => $data['cidade'],
                'pais_atual' => $data['pais'] ?? $usuario->tecnico->pais_atual,
            ], $telefoneSecundario));
        }

        if ($usuario->perfil === 'OFICINA' && $usuario->oficina) {
            $usuario->oficina->update(array_merge([
                'nome_fantasia' => $data['nome_completo'],
                'cnpj' => $data['documento'] ?? $usuario->oficina->cnpj,
                'cidade' => $data['cidade'],
                'pais' => $data['pais'] ?? $usuario->oficina->pais,
                'prazo_pagamento' => $data['prazo_pagamento'] ?? $usuario->oficina->prazo_pagamento,
            ], $telefoneSecundario));
        }

        return response()->json([
            'message' => __('main.admin_user_updated_success'),
            'data' => new UsuarioResource($usuario->fresh(['oficina', 'tecnico'])),
        ]);
    }
}
