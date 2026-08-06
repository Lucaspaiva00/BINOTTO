<?php

namespace App\Http\Controllers\Api\Mobile\Oficina;

use App\Http\Controllers\Controller;
use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OficinaTecnicoBloqueadoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $oficina = Oficina::where('usuario_id', $user->id)->first();

            if (! $oficina) {
                return response()->json([
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $tecnicosIds = $oficina->tecnicos_bloqueados ?? [];

            $tecnicos = Tecnico::with('user')
                ->whereIn('id', $tecnicosIds)
                ->get()
                ->map(function ($tecnico) {
                    return [
                        'id' => $tecnico->id,
                        'nome_completo' => $tecnico->nome_completo,
                        'whatsapp' => $tecnico->user?->whatsapp,
                        'isRegistered' => true,
                        'status' => $tecnico->user?->pre_cadastro !== 1 ? 'registered' : 'invited',
                    ];
                });

            return response()->json([
                'data' => $tecnicos,
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao listar tecnicos bloqueados: '.$e->getMessage());

            return response()->json([
                'message' => __('main.tecnico_bloqueado_list_error'),
            ], 500);
        }
    }

    public function checkTechnician(Request $request)
    {
        try {
            $request->validate([
                'whatsapp' => ['required', 'string'],
            ]);

            $user = $request->user();

            $oficina = Oficina::where('usuario_id', $user->id)->first();

            if (!$oficina) {
                return response()->json([
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $digitsWhatsapp = preg_replace('/\D/', '', $request->whatsapp);
            $whatsapp = '+'.$digitsWhatsapp;

            $userTecnico = User::where('whatsapp', $whatsapp)->first();

            if (! $userTecnico) {
                return response()->json([
                    'registered' => false,
                    'blocked' => false,
                ]);
            }

            $tecnico = Tecnico::where('usuario_id', $userTecnico->id)->first();

            if (!$tecnico) {
                return response()->json([
                    'registered' => false,
                    'blocked' => false,
                ]);
            }

            $tecnicosBloqueados = $oficina->tecnicos_bloqueados ?? [];

            return response()->json([
                'registered' => true,
                'blocked' => in_array($tecnico->id, $tecnicosBloqueados),
            ]);

        } catch (Exception $e) {
            Log::error('Erro ao verificar bloqueio do técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => __('main.tecnico_bloqueado_check_error'),
            ], 500);
        }
    }

    public function addTecnico(Request $request)
    {
        try {
            $request->validate([
                'whatsapp' => ['required', 'string'],
            ]);

            $user = $request->user();

            $oficina = Oficina::where('usuario_id', $user->id)->first();

            if (! $oficina) {
                return response()->json([
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $digitsWhatsapp = preg_replace('/\D/', '', $request->whatsapp);
            $whatsapp = '+'.$digitsWhatsapp;

            $userTecnico = User::where('whatsapp', $whatsapp)->first();
            $tecnico = $userTecnico ? Tecnico::where('usuario_id', $userTecnico->id)->first() : null;

            if (! $userTecnico || ! $tecnico) {
                return response()->json([
                    'message' => __('main.tecnico_not_found'),
                ], 404);
            }

            $tecnicosBloqueados = $oficina->tecnicos_bloqueados ?? [];

            // evita duplicado
            if (in_array($tecnico->id, $tecnicosBloqueados)) {
                return response()->json([
                    'message' => __('main.tecnico_already_bloqueado'),
                ], 409);
            }

            $tecnicosBloqueados[] = $tecnico->id;

            $tecnicosPreferidos = array_values(
                array_filter($oficina->tecnicos_preferidos ?? [], fn ($tecnicoId) => $tecnicoId != $tecnico->id)
            );

            $oficina->tecnicos_bloqueados = $tecnicosBloqueados;
            $oficina->tecnicos_preferidos = $tecnicosPreferidos;
            $oficina->save();

            return response()->json([
                'message' => __('main.tecnico_bloqueado_add_success'),
                'data' => [
                    'id' => $tecnico->id,
                    'nome_completo' => $tecnico->nome_completo,
                    'whatsapp' => $tecnico->user?->whatsapp,
                    'isRegistered' => true,
                    'status' => $tecnico->user?->pre_cadastro !== 1 ? 'registered' : 'invited',
                ],
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao bloquear técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => __('main.tecnico_bloqueado_add_error'),
            ], 500);
        }
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $oficina = Oficina::where('usuario_id', $user->id)->first();

            if (! $oficina) {
                return response()->json([
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $tecnicosBloqueados = $oficina->tecnicos_bloqueados ?? [];

            $tecnicosFiltrados = array_values(
                array_filter($tecnicosBloqueados, fn ($tecnicoId) => $tecnicoId != $id)
            );

            $oficina->tecnicos_bloqueados = $tecnicosFiltrados;
            $oficina->save();

            return response()->json([
                'message' => __('main.tecnico_bloqueado_remove_success'),
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao desbloquear tecnico: '.$e->getMessage());

            return response()->json([
                'message' => __('main.tecnico_bloqueado_remove_error'),
            ], 500);
        }
    }
}
