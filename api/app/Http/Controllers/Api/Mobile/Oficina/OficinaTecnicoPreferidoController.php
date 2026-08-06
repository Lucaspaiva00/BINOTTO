<?php

namespace App\Http\Controllers\Api\Mobile\Oficina;

use App\Http\Controllers\Controller;
use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class OficinaTecnicoPreferidoController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $oficina = Oficina::where('usuario_id', $user->id)->first();

            if (!$oficina) {
                return response()->json([
                    'message' => __('main.oficina_not_found'),
                ], 404);
            }

            $tecnicosIds = $oficina->tecnicos_preferidos ?? [];

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
            Log::error('Erro ao listar tecnicos preferidos: '.$e->getMessage());

            return response()->json([
                'message' => __('main.tecnico_list_error'),
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
            $tecnico = Tecnico::where('usuario_id', $userTecnico->id)->first();

            if (! $userTecnico || ! $tecnico) {
                return response()->json([
                    'message' => __('main.tecnico_not_found'),
                ], 404);
            }

            $tecnicosPreferidos = $oficina->tecnicos_preferidos ?? [];

            // evita duplicado
            if (in_array($tecnico->id, $tecnicosPreferidos)) {
                return response()->json([
                    'message' => __('main.tecnico_already_in_list'),
                ], 409);
            }

            // limite de 3
            if (count($tecnicosPreferidos) >= 3) {
                return response()->json([
                    'message' => __('main.tecnico_limit_reached'),
                ], 422);
            }

            $tecnicosPreferidos[] = $tecnico->id;

            $tecnicosBloqueados = array_values(
                array_filter($oficina->tecnicos_bloqueados ?? [], fn ($tecnicoId) => $tecnicoId != $tecnico->id)
            );

            $oficina->tecnicos_preferidos = $tecnicosPreferidos;
            $oficina->tecnicos_bloqueados = $tecnicosBloqueados;
            $oficina->save();

            return response()->json([
                'message' => __('main.tecnico_add_success'),
                'data' => [
                    'id' => $tecnico->id,
                    'nome_completo' => $tecnico->nome_completo,
                    'whatsapp' => $tecnico->user?->whatsapp,
                    'isRegistered' => true,
                    'status' => $tecnico->user?->pre_cadastro !== 1 ? 'registered' : 'invited',
                ],
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao adicionar técnico preferido', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => __('main.tecnico_add_error'),
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

            $tecnicos = $oficina->tecnicos_preferidos ?? [];

            // remove pelo id
            $tecnicosFiltrados = array_values(
                array_filter($tecnicos, function ($tecnico) use ($id) {
                    return isset($tecnico['id']) && $tecnico['id'] != $id;
                })
            );

            $oficina->tecnicos_preferidos = $tecnicosFiltrados;
            $oficina->save();

            return response()->json([
                'message' => __('main.tecnico_remove_success'),
            ], 200);

        } catch (Exception $e) {
            Log::error('Erro ao remover tecnico preferido: '.$e->getMessage());

            return response()->json([
                'message' => __('main.tecnico_remove_error'),
            ], 500);
        }
    }

    public function preRegisterTecnico(Request $request)
    {
        try {
            $request->validate([
                'nome_completo' => ['required', 'string'],
                'whatsapp' => ['required', 'string', 'max:30'],
            ]);

            $userOficina = $request->user();
            $oficina = Oficina::where('usuario_id', $userOficina->id)->first();

            DB::beginTransaction();

            // cria usuario e tecnico
            $whatsapp = preg_replace('/\D/', '', $request->whatsapp);
            $existingUser = User::where('whatsapp', $whatsapp)->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => __('main.tecnico_whatsapp_exists'),
                ], 409);
            }

            $tempPassword = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);

            $user = User::create([
                'email' => null,
                'senha' => Hash::make($tempPassword),
                'whatsapp' => $whatsapp,
                'senha_convite' => $tempPassword,
                'oficina_id_convite' => $oficina->id,
                'perfil' => 'TECNICO',
                'pre_cadastro' => 1,
                'ativo' => false,
            ]);

            $tecnico = Tecnico::create([
                'nome_completo' => $request->nome_completo,
                'apelido' => null,
                'usuario_id' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.tecnico_pre_register_success'),
                'data' => [
                    'id' => $tecnico->id,
                    'nome_completo' => $tecnico->nome_completo,
                    'whatsapp' => $tecnico->user->whatsapp,
                    'senha_convite' => $user->senha_convite,
                    'isRegistered' => true,
                    'status' => 'invited',
                ],
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao pré-cadastrar técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.tecnico_pre_register_error'),
            ], 500);
        }
    }

    public function checkTechnician(Request $request)
    {
        try {
            $request->validate([
                'whatsapp' => ['required', 'string'],
            ]);

            $digitsWhatsapp = preg_replace('/\D/', '', $request->whatsapp);
            $whatsapp = '+'.$digitsWhatsapp;

            $user = User::where('whatsapp', $whatsapp)->first();

            if (! $user) {
                return response()->json([
                    'registered' => false,
                ]);
            }

            $tecnico = Tecnico::where('usuario_id', $user->id)->first();

            if (! $tecnico) {
                return response()->json([
                    'registered' => false,
                ]);
            }

            return response()->json([
                'registered' => true,
                // 'status' => $user->pre_cadastro !== 1 ? 'registered' : 'invited',
                // 'senha_convite' => $user->pre_cadastro === 1 ? $user->senha_convite : null
            ]);

        } catch (Exception $e) {
            Log::error('Erro ao verificar existência do técnico', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => __('main.tecnico_check_error'),
            ], 500);
        }
    }
}
