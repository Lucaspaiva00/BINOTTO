<?php

namespace App\Http\Controllers\Api\Mobile\Oficina;

use App\Http\Controllers\Controller;
use App\Models\Oficina;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OficinaPerfilController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            $oficina = $user->oficina;

            if (!$oficina) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'oficina' => $oficina,
                    'email' => $user->email,
                    'codigo_pais_telefone' => $user->codigo_pais_telefone,
                    'numero_telefone' => $user->numero_telefone,
                    'iso_pais_telefone' => $user->iso_pais_telefone
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao buscar oficina', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.oficina_fetch_error'),
            ], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $oficina = Oficina::with('user')->find($id);

            if (!$oficina) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'oficina' => $oficina,
                    'email' => $oficina->user->email,
                    'codigo_pais_telefone' => $oficina->user->codigo_pais_telefone,
                    'numero_telefone' => $oficina->user->numero_telefone,
                    'iso_pais_telefone' => $oficina->user->iso_pais_telefone
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao buscar oficina', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.oficina_fetch_error'),
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = auth()->user();

            $oficina = $user->oficina;

            if (!$oficina) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $validated = $request->validate([
                'nome_fantasia' => 'required|string|max:255',
                'nome_responsavel' => 'required|string|max:255',
                'cnpj' => 'nullable|string|max:30',
                'razao_social' => 'nullable|string|max:255',
                'email' => 'required|email|max:255|unique:usuarios,email,' . $user->id,
                'email_secundario' => 'nullable|email|max:255',
                'codigo_pais_telefone' => 'nullable|string|max:5',
                'numero_telefone' => 'nullable|string|max:15',
                'iso_pais_telefone' => 'nullable|string|max:2',
                'telefone_secundario' => 'nullable|string|max:15',
                'codigo_pais_telefone_secundario' => 'nullable|string|max:5',
                'iso_pais_telefone_secundario' => 'nullable|string|max:2',
                'numero' => 'required|string|max:10',
                'rua' => 'required|string|max:255',
                'complemento' => 'nullable|string|max:255',
                'cidade' => 'required|string|max:255',
                'cep' => 'required|string|max:20',
                'estado' => 'required|string|max:100',
                'pais' => 'required|string|max:100',
                'prazo_pagamento' => 'nullable|string|max:100',
            ]);

            $whatsapp = $validated['codigo_pais_telefone'] . $validated['numero_telefone'];

            if (User::where('whatsapp', $whatsapp)->where('id', '!=', $user->id)->exists()) {
                return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
            }

            DB::beginTransaction();

            // Atualizar oficina
            $oficina->update([
                'nome_fantasia' => $validated['nome_fantasia'] ?? $oficina->nome_fantasia,
                'nome_responsavel' => $validated['nome_responsavel'] ?? $oficina->nome_responsavel,
                'cnpj' => $validated['cnpj'],
                'razao_social' => $validated['razao_social'],
                'email_secundario' => strtolower($validated['email_secundario']),
                'telefone_secundario' => $validated['telefone_secundario'] ?? null,
                'codigo_pais_telefone_secundario' => !empty($validated['telefone_secundario'])
                    ? ($validated['codigo_pais_telefone_secundario'] ?? null)
                    : null,
                'iso_pais_telefone_secundario' => !empty($validated['telefone_secundario'])
                    ? ($validated['iso_pais_telefone_secundario'] ?? null)
                    : null,
                'numero' => $validated['numero'],
                'rua' => $validated['rua'],
                'complemento' => $validated['complemento'],
                'cidade' => $validated['cidade'],
                'cep' => $validated['cep'],
                'estado' => $validated['estado'],
                'pais' => $validated['pais'],
                'prazo_pagamento' => $validated['prazo_pagamento'],
            ]);

            $user->update([
                'email' => strtolower($validated['email']) ?? $user->email,
                'codigo_pais_telefone' => $validated['codigo_pais_telefone'] ?? $user->codigo_pais_telefone,
                'numero_telefone' => $validated['numero_telefone'] ?? $user->numero_telefone,
                'iso_pais_telefone' => $validated['iso_pais_telefone'] ?? $user->iso_pais_telefone,
                'whatsapp' => $validated['codigo_pais_telefone'] . $validated['numero_telefone'] ?? $user->whatsapp,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.profile_updated_success'),
                'data' => [
                    'oficina' => $oficina->fresh(),
                    'nome' => $oficina->fresh()->nome_fantasia,
                    'email' => $user->fresh()->email,
                    'codigo_pais_telefone' => $user->fresh()->codigo_pais_telefone,
                    'numero_telefone' => $user->fresh()->numero_telefone,
                    'iso_pais_telefone' => $user->fresh()->iso_pais_telefone,
                    'whatsapp' => $user->fresh()->whatsapp,
                    'podeSolicitarTecnico' => $oficina->fresh()->podeSolicitarTecnico()
                ],
            ], 200);

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao atualizar perfil', [
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