<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Mobile\RegisterTecnicoRequest;
use App\Http\Requests\Api\Mobile\RegisterOficinaRequest;
use App\Http\Requests\Api\Mobile\RegisterSocialRequest;
use App\Http\Services\GoogleService;
use App\Http\Services\AppleService;
use App\Http\Services\FacebookService;
use App\Models\User;
use App\Models\Tecnico;
use App\Models\Oficina;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UsuarioController extends Controller
{
    private GoogleService $googleService;
    private AppleService $appleService;
    private FacebookService $facebookService;

    public function __construct(
        GoogleService $googleService,
        AppleService $appleService,
        FacebookService $facebookService
    ) {
        $this->googleService = $googleService;
        $this->appleService = $appleService;
        $this->facebookService = $facebookService;
    }

    public function registerTecnico(RegisterTecnicoRequest $request)
    {
        try {
            $whatsapp = $request->codigo_pais_telefone . $request->numero_telefone;

            if (User::where('email', $request->email)->exists()) {
                return response()->json(['message' => __('main.user_email_already_registered')], 422);
            }

            if (User::where('whatsapp', $whatsapp)->exists()) {
                return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
            }

            DB::beginTransaction();

            $user = User::create([
                'email' => $request->email,
                'codigo_pais_telefone' => $request->codigo_pais_telefone,
                'numero_telefone' => $request->numero_telefone,
                'iso_pais_telefone' => $request->iso_pais_telefone,
                'whatsapp' => $whatsapp,
                'senha' => Hash::make($request->senha),
                'perfil' => 'TECNICO',
                'ativo' => true,
            ]);

            Tecnico::create([
                'nome_completo' => $request->nome_completo,
                'apelido' => $request->apelido,
                'usuario_id' => $user->id,
            ]);

            DB::commit();

            return response()->json(['message' => __('main.tecnico_register_success')], 201);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao criar conta de técnico: ' . $e->getMessage());

            return response()->json([
                'message' => __('main.tecnico_register_error')
            ], 500);
        }
    }

    public function registerOficina(RegisterOficinaRequest $request)
    {
        try {
            $whatsapp = $request->codigo_pais_telefone . $request->numero_telefone;

            if (User::where('email', $request->email)->exists()) {
                return response()->json(['message' => __('main.user_email_already_registered')], 422);
            }

            if (User::where('whatsapp', $whatsapp)->exists()) {
                return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
            }

            DB::beginTransaction();

            $user = User::create([
                'email' => $request->email,
                'codigo_pais_telefone' => $request->codigo_pais_telefone,
                'numero_telefone' => $request->numero_telefone,
                'iso_pais_telefone' => $request->iso_pais_telefone,
                'whatsapp' => $whatsapp,
                'senha' => Hash::make($request->senha),
                'perfil' => 'OFICINA',
                'ativo' => true,
            ]);

            Oficina::create([
                'nome_fantasia' => $request->nome_fantasia,
                'nome_responsavel' => $request->nome_responsavel,
                'usuario_id' => $user->id,
            ]);

            DB::commit();

            return response()->json(['message' => __('main.oficina_register_success')], 201);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao criar conta de oficina: ' . $e->getMessage());

            return response()->json([
                'message' => __('main.oficina_register_error')
            ], 500);
        }
    }

    public function registerSocial(RegisterSocialRequest $request)
    {

        try {
            $field = match ($request->tipo) {
                'google' => 'google_id',
                'apple' => 'apple_id',
                'facebook' => 'facebook_id',
            };

            $user = User::withTrashed()
                ->where($field, $request->id)
                ->first();

            if ($user) {
                return response()->json([
                    'message' => __('main.user_social_already_registered'),
                ], 409);
            }

            if (
                $request->tipo === 'google' &&
                !$this->googleService->isValidGoogleUser($request->idToken, $request->id)
            ) {
                return response()->json([
                    'message' => __('main.invalid_google_identity'),
                ], 401);
            }

            if (
                $request->tipo === 'apple' &&
                !$this->appleService->isValidAppleUser($request->idToken, $request->id)
            ) {
                return response()->json([
                    'message' => __('main.invalid_apple_identity'),
                ], 401);
            }

            if (
                $request->tipo === 'facebook' &&
                !$this->facebookService->isValidFacebookUser($request->idToken, $request->id)
            ) {
                return response()->json([
                    'message' => __('main.invalid_facebook_identity'),
                ], 401);
            }


            if ($request->filled('email')) {
                $emailExists = User::withTrashed()
                    ->whereRaw('LOWER(email) = ?', [strtolower($request->email)])
                    ->exists();

                if ($emailExists) {
                    return response()->json([
                        'message' => __('main.user_email_already_registered'),
                    ], 409);
                }
            }

            DB::beginTransaction();

            $user = User::create([
                $field => $request->id,
                'nome' => $request->nome ?? '_TEMP',
                'email' => $request->email,
                'perfil' => $request->perfil,
                'pre_cadastro_social' => 1,
                'ativo' => false,
            ]);

            if ($request->perfil === 'OFICINA') {
                Oficina::create([
                    'nome_fantasia' => $request->nome ?? '_TEMP',
                    'nome_responsavel' => $request->nome ?? '_TEMP',
                    'usuario_id' => $user->id,
                ]);
            }

            if ($request->perfil === 'TECNICO') {
                Tecnico::create([
                    'nome_completo' => $request->nome ?? '_TEMP',
                    'usuario_id' => $user->id,
                ]);
            }

            DB::commit();

            $user->load(
                $request->perfil === 'TECNICO' ? 'tecnico' : 'oficina'
            );

            return response()->json([
                'message' => __('main.social_register_success'),
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'perfil' => $user->perfil,
                    'tecnico' => $user->tecnico ? [
                        'nome_completo' => $user->tecnico->nome_completo,
                    ] : null,
                    'oficina' => $user->oficina ? [
                        'nome_fantasia' => $user->oficina->nome_fantasia,
                        'nome_responsavel' => $user->oficina->nome_responsavel,
                    ] : null,
                ],
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao criar conta social: ' . $e->getMessage());

            return response()->json([
                'message' => __('main.social_register_error')
            ], 500);
        }
    }

    public function deleteAccount(Request $request)
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['message' => __('main.user_not_authenticated')], 401);
        }

        try {
            DB::beginTransaction();

            $user->ativo = false;
            $user->save();

            $user->delete();

            auth('api')->logout();

            DB::commit();

            return response()->json(['message' => __('main.account_deleted_success')], 200);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao remover conta: ' . $e->getMessage());

            return response()->json(['message' => __('main.account_delete_error')], 500);
        }
    }
}
