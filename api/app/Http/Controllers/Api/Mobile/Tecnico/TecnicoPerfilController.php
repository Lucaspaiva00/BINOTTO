<?php

namespace App\Http\Controllers\Api\Mobile\Tecnico;

use App\Http\Controllers\Controller;
use App\Models\Tecnico;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class TecnicoPerfilController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            $tecnico = $user->tecnico;

            if (!$tecnico) {
                return response()->json([ 
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'tecnico' => $tecnico,
                    'email' => $user->email,
                    'codigo_pais_telefone' => $user->codigo_pais_telefone,
                    'numero_telefone' => $user->numero_telefone,
                    'iso_pais_telefone' => $user->iso_pais_telefone
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao buscar técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar técnico.',
            ], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $tecnico = Tecnico::with('user')->find($id);

            if (!$tecnico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'tecnico' => $tecnico,
                    'email' => $tecnico->user->email,
                    'codigo_pais_telefone' => $tecnico->user->codigo_pais_telefone,
                    'numero_telefone' => $tecnico->user->numero_telefone,
                    'iso_pais_telefone' => $tecnico->user->iso_pais_telefone
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao buscar técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.tecnico_fetch_error'),
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = auth()->user();

            $usuario = User::with('tecnico')->find($user->id);

            if (!$usuario || !$usuario->tecnico) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_not_found'),
                ], 404);
            }

            $validated = $request->validate([
                'nome_completo' => 'required|string|max:255',
                'apelido' => 'nullable|string|max:100',
                'email' => ['required', 'email', Rule::unique('usuarios', 'email')->ignore($user->id)],
                'codigo_pais_telefone' => 'nullable|string|max:5',
                'numero_telefone' => 'nullable|string|max:15',
                'codigo_pais_telefone_secundario' => 'nullable|string|max:5',
                'iso_pais_telefone' => 'nullable|string|max:2',
                'telefone_secundario' => 'nullable|string|max:15',
                'iso_pais_telefone_secundario' => 'nullable|string|max:2',
                'data_nascimento' => 'nullable|date',
                'nacionalidade' => 'nullable|string|max:100',
                'nacionalidade_secundaria' => 'nullable|string|max:100',
                'cpf' => 'nullable|string|max:20',
                'cnpj' => 'nullable|string|max:30',
                'nome_fantasia_empresa' => 'nullable|string|max:150',
                'razao_social_empresa' => 'nullable|string|max:150',
                'endereco_rua' => 'nullable|string|max:180',
                'endereco_numero' => 'nullable|string|max:40',
                'endereco_complemento' => 'nullable|string|max:120',
                'endereco_cidade' => 'nullable|string|max:120',
                'endereco_estado' => 'nullable|string|max:80',
                'endereco_cep' => 'nullable|string|max:20',
                'pais_atual' => 'nullable|string|max:100',
                'disponibilidade_geografica' => 'nullable|array',
            ]);

            $whatsapp = ($validated['codigo_pais_telefone'] ?? '') . ($validated['numero_telefone'] ?? '');

            if (!empty($whatsapp) && User::where('whatsapp', $whatsapp)->where('id', '!=', $user->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.user_whatsapp_already_registered'),
                ], 422);
            }

            DB::beginTransaction();

            $usuario->update([
                'email' => strtolower($validated['email']) ?? $usuario->email,
                'codigo_pais_telefone' => $validated['codigo_pais_telefone'] ?? $usuario->codigo_pais_telefone,
                'numero_telefone' => $validated['numero_telefone'] ?? $usuario->numero_telefone,
                'iso_pais_telefone' => $validated['iso_pais_telefone'] ?? $usuario->iso_pais_telefone,
                'whatsapp' => !empty($whatsapp) ? $whatsapp : $usuario->whatsapp,
            ]);

            $usuario->tecnico->update([
                'nome_completo' => $validated['nome_completo'],
                'apelido' => $validated['apelido'] ?? null,
                'telefone_secundario' => $validated['telefone_secundario'] ?? null,
                'codigo_pais_telefone_secundario' => !empty($validated['telefone_secundario'])
                    ? ($validated['codigo_pais_telefone_secundario'] ?? null)
                    : null,
                'iso_pais_telefone_secundario' => !empty($validated['telefone_secundario'])
                    ? ($validated['iso_pais_telefone_secundario'] ?? null)
                    : null,
                'data_nascimento' => $validated['data_nascimento'] ?? null,
                'nacionalidade' => $validated['nacionalidade'] ?? null,
                'nacionalidade_secundaria' => $validated['nacionalidade_secundaria'] ?? null,
                'cpf' => $validated['cpf'] ?? null,
                'cnpj' => $validated['cnpj'] ?? null,
                'nome_fantasia_empresa' => $validated['nome_fantasia_empresa'] ?? null,
                'razao_social_empresa' => $validated['razao_social_empresa'] ?? null,
                'endereco_rua' => $validated['endereco_rua'] ?? null,
                'endereco_numero' => $validated['endereco_numero'] ?? null,
                'endereco_complemento' => $validated['endereco_complemento'] ?? null,
                'endereco_cidade' => $validated['endereco_cidade'] ?? null,
                'endereco_estado' => $validated['endereco_estado'] ?? null,
                'endereco_cep' => $validated['endereco_cep'] ?? null,
                'pais_atual' => $validated['pais_atual'] ?? null,
                'disponibilidade_geografica' => $validated['disponibilidade_geografica'] ?? [],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.profile_updated_success'),
                'data' => [
                    'tecnico' => $usuario->tecnico->fresh(),
                    'email' => $usuario->fresh()->email,
                    'codigo_pais_telefone' => $usuario->fresh()->codigo_pais_telefone,
                    'numero_telefone' => $usuario->fresh()->numero_telefone,
                    'iso_pais_telefone' => $usuario->fresh()->iso_pais_telefone,
                    'whatsapp' => $usuario->fresh()->whatsapp,
                ],
            ], 200);

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao atualizar perfil técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.profile_update_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
