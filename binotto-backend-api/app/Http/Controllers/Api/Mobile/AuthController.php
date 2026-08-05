<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\DispositivoUsuario;
use App\Models\Oficina;
use App\Models\Tecnico;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string', // E-mail ou Whatsapp
            'senha' => 'required|string',
            'idioma' => 'nullable|string',
            'push_token' => 'nullable|string',
            'plataforma' => 'nullable|string',
        ]);

        $login = $request->input('login');
        $password = $request->input('senha');

        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'whatsapp';

        if ($field === 'whatsapp') {
            $digits = preg_replace('/\D/', '', $login);
            $login = '+' . $digits;
        }

        $user = User::withTrashed()->where($field, $login)->first();

        if (!$user) {
            return response()->json(['error' => __('auth.invalid_credentials')], 401);
        }

        if (!$user->ativo) {
            return response()->json(['error' => __('auth.inactive_user')], 403);
        }

        if (!Hash::check($password, $user->senha) || !in_array($user->perfil, ['TECNICO', 'OFICINA'])) {
            return response()->json(['error' => __('auth.invalid_credentials')], 401);
        }

        // Salva o token para notificações
        if ($request->push_token) {
            DispositivoUsuario::updateOrCreate(
                ['token' => $request->push_token],
                [
                    'usuario_id' => $user->id,
                    'plataforma' => $request->plataforma,
                    'ultimo_uso_em' => now(),
                    'idioma' => $request->idioma,
                ]
            );
        }

        // Muda idioma no login
        if ($request->filled('idioma') && $request->idioma !== $user->idioma) {
            $user->update([
                'idioma' => $request->idioma,
            ]);
        }

        // Usado para o redirect para tela de 1º acesso do tecnico
        if ($user->pre_cadastro === 1) {
            return response()->json([
                'status' => "PRE_REGISTRATION",
                'user' => [
                    'id' => $user->id,
                    'whatsapp' => $user->whatsapp,
                    'workshopName' => $user->oficinaConvite->nome_fantasia,
                ]
            ], 200);
        }

        // Gera token jwt
        $token = auth('api')->login($user);

        return response()->json([
            'status' => "AUTHENTICATED",
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->perfil === 'TECNICO' ? $user->tecnico->nome_completo ?? $user->tecnico->apelido : $user->oficina->nome_fantasia,
                'email' => $user->email,
                'whatsapp' => $user->whatsapp,
                'countryCode' => $user->codigo_pais_telefone,
                'countryIso' => $user->iso_pais_telefone,
                'phoneNumber' => $user->numero_telefone,
                'profile' => $user->perfil,
                'profileId' => $user->perfil === 'TECNICO' ? $user->tecnico->id : $user->oficina->id,
                'canRequestTechnician' => $user->perfil === 'OFICINA'
                    ? $user->oficina->podeSolicitarTecnico()
                    : false,
                'active' => $user->ativo,
            ]
        ], 200);
    }

    public function loginSocial(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|in:google,apple,facebook',
            'id' => 'required|string',
            'idioma' => 'nullable|string',
            'push_token' => 'nullable|string',
            'plataforma' => 'nullable|string',
            'idToken'  => 'nullable|string',
        ]);

        $field = match ($data['tipo']) {
            'google' => 'google_id',
            'apple' => 'apple_id',
            'facebook' => 'facebook_id',
        };

        $user = User::withTrashed()->where($field, $data['id'])->first();

        if (!$user) {
            return response()->json(['error' => __('auth.invalid_credentials')], 401);
        }

        if (!$user->ativo) {
            return response()->json(['error' => __('auth.inactive_user')], 403);
        }

        if (!in_array($user->perfil, ['TECNICO', 'OFICINA'])) {
            return response()->json(['error' => __('auth.invalid_credentials')], 401);
        }

        // Salva o token para notificações
        if ($request->push_token) {
            DispositivoUsuario::updateOrCreate(
                ['token' => $request->push_token],
                [
                    'usuario_id' => $user->id,
                    'plataforma' => $request->plataforma,
                    'ultimo_uso_em' => now(),
                    'idioma' => $request->idioma,
                ]
            );
        }

        // Muda idioma no login
        if ($request->filled('idioma') && $request->idioma !== $user->idioma) {
            $user->update([
                'idioma' => $request->idioma,
            ]);
        }

        // Usado para o redirect para tela de finalizar cadastro
        if ($user->pre_cadastro_social === 1) {
            return response()->json([
                'status' => "PRE_REGISTRATION_SOCIAL",
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
            ], 200);
        }

        // Gera token jwt
        $token = auth('api')->login($user);

        return response()->json([
            'status' => "AUTHENTICATED",
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->perfil === 'TECNICO' ? $user->tecnico->nome_completo ?? $user->tecnico->apelido : $user->oficina->nome_fantasia,
                'email' => $user->email,
                'whatsapp' => $user->whatsapp,
                'countryCode' => $user->codigo_pais_telefone,
                'countryIso' => $user->iso_pais_telefone,
                'phoneNumber' => $user->numero_telefone,
                'profile' => $user->perfil,
                'profileId' => $user->perfil === 'TECNICO' ? $user->tecnico->id : $user->oficina->id,
                'canRequestTechnician' => $user->perfil === 'OFICINA'
                    ? $user->oficina->podeSolicitarTecnico()
                    : false,
                'active' => $user->ativo,
            ]
        ], 200);
    }

    public function completeRegistrationSocialAndLogin(Request $request)
    {
        $data = $request->validate([
            'usuario_id' => 'required|integer|exists:usuarios,id',
            'perfil' => 'required|in:TECNICO,OFICINA',
            'nome_completo' => 'required_if:perfil,TECNICO|string',
            'nome_fantasia' => 'required_if:perfil,OFICINA|string',
            'nome_responsavel' => 'required_if:perfil,OFICINA|string',
            'email' => [
                'nullable',
                'email',
                Rule::unique('usuarios', 'email')->ignore($request->usuario_id),
            ],
            'idioma' => 'nullable|string',
            'push_token' => 'nullable|string',
            'plataforma' => 'nullable|string',
        ]);

        $user = User::find($data['usuario_id']);

        if (!$user) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        if (!$user->pre_cadastro_social) {
            return response()->json(['message' => __('auth.already_completed')], 400);
        }

        DB::beginTransaction();

        try {
            if ($data['push_token']) {
                DispositivoUsuario::updateOrCreate(
                    ['token' => $data['push_token']],
                    [
                        'usuario_id' => $user->id,
                        'plataforma' => $data['plataforma'],
                        'ultimo_uso_em' => now(),
                        'idioma' => isset($data['idioma']) ? $data['idioma'] : $user->idioma,
                    ]
                );
            }

            $user->update([
                'email' => strtolower($data['email']) ?? $user->email,
                'pre_cadastro_social' => 0,
                'ativo' => true,
                'idioma' => isset($data['idioma']) ? $data['idioma'] : $user->idioma
            ]);

            if ($data['perfil'] === "TECNICO") {
                Tecnico::updateOrCreate(
                    ['usuario_id' => $user->id],
                    [
                        'nome' => $data['nome_completo'],
                    ]
                );
            }

            if ($data['perfil'] === "OFICINA") {
                Oficina::updateOrCreate(
                    ['usuario_id' => $user->id],
                    [
                        'nome_fantasia' => $data['nome_fantasia'],
                        'nome_responsavel' => $data['nome_responsavel'],
                    ]
                );
            }

            DB::commit();

            // gera JWT
            $token = auth('api')->login($user);
            $user->refresh();
            $user->load('tecnico', 'oficina');

            return response()->json([
                'status' => "AUTHENTICATED",
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->perfil === 'TECNICO' ? $user->tecnico->nome_completo ?? $user->tecnico->apelido : $user->oficina->nome_fantasia,
                    'email' => $user->email,
                    'whatsapp' => $user->whatsapp,
                    'countryCode' => $user->codigo_pais_telefone,
                    'countryIso' => $user->iso_pais_telefone,
                    'phoneNumber' => $user->numero_telefone,
                    'profile' => $user->perfil,
                    'profileId' => $user->perfil === 'TECNICO' ? $user->tecnico->id : $user->oficina->id,
                    'canRequestTechnician' => $user->perfil === 'OFICINA'
                        ? $user->oficina->podeSolicitarTecnico()
                        : false,
                    'active' => $user->ativo,
                ]
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Erro ao finalizar conta social: ' . $e->getMessage());

            return response()->json([
                'message' => __('main.social_registration_failed'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function completeRegistrationAndLogin(Request $request)
    {
        $data = $request->validate(
            [
                'usuario_id' => 'required|integer|exists:usuarios,id',
                'nome' => 'required|string',
                'apelido' => 'nullable|string',
                'email' => 'required|email',
                'senha' => 'required|string|min:6',
                'senha_confirmacao' => 'required|string|same:senha',
                'codigo_pais_telefone' => 'required|string|max:5',
                'numero_telefone' => 'required|string|max:15',
                'iso_pais_telefone' => 'nullable|string|max:2',
                'codigo_pais_telefone_secundario' => 'nullable|string|max:5',
                'telefone_secundario' => 'nullable|string|max:15',
                'iso_pais_telefone_secundario' => 'nullable|string|max:2',
            ],
            [],
            [
                'codigo_pais_telefone' => 'whatsapp',
                'numero_telefone' => 'whatsapp',
            ]
        );

        $user = User::find($data['usuario_id']);

        if (!$user) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        // evita reutilização de pré-cadastro
        if (!$user->pre_cadastro) {
            return response()->json(['message' => __('auth.already_completed')], 400);
        }

        $whatsapp = $data['codigo_pais_telefone'] . $data['numero_telefone'];
        if (User::where('whatsapp', $whatsapp)->where('id', '!=', $user->id)->exists()) {
            return response()->json(['message' => __('main.user_whatsapp_already_registered')], 422);
        }

        DB::beginTransaction();

        $user->update([
            'email' => strtolower($data['email']),
            'senha' => Hash::make($data['senha']),
            'codigo_pais_telefone' => $data['codigo_pais_telefone'],
            'numero_telefone' => $data['numero_telefone'],
            'iso_pais_telefone' => $data['iso_pais_telefone'],
            'whatsapp' => $whatsapp,
            'pre_cadastro' => 0,
            'senha_convite' => null,
            'ativo' => true
        ]);

        if ($user->perfil === 'TECNICO' && $user->tecnico) {
            $user->tecnico->update([
                'nome_completo' => $data['nome'],
                'apelido' => $data['apelido'],
                'telefone_secundario' => $data['telefone_secundario'] ?? null,
                'codigo_pais_telefone_secundario' => !empty($data['telefone_secundario'])
                    ? ($data['codigo_pais_telefone_secundario'] ?? null)
                    : null,
                'iso_pais_telefone_secundario' => !empty($data['telefone_secundario'])
                    ? ($data['iso_pais_telefone_secundario'] ?? null)
                    : null,
            ]);
        }

        DB::commit();

        // gera JWT
        $token = auth('api')->login($user);
        $user->refresh();
        $user->load('tecnico', 'oficina');

        return response()->json([
            'status' => "AUTHENTICATED",
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->perfil === 'TECNICO' ? $user->tecnico->nome_completo ?? $user->tecnico->apelido : $user->oficina->nome_fantasia,
                'email' => $user->email,
                'whatsapp' => $user->whatsapp,
                'countryCode' => $user->codigo_pais_telefone,
                'countryIso' => $user->iso_pais_telefone,
                'phoneNumber' => $user->numero_telefone,
                'profile' => $user->perfil,
                'profileId' => $user->perfil === 'TECNICO' ? $user->tecnico->id : $user->oficina->id,
                'canRequestTechnician' => $user->perfil === 'OFICINA'
                    ? $user->oficina->podeSolicitarTecnico()
                    : false,
                'active' => $user->ativo,
            ]
        ], 200);
    }

    public function changeIdioma(Request $request)
    {
        $request->validate([
            'idioma' => 'required|string|size:5'
        ]);

        $user = auth('api')->user();

        $user->update([
            'idioma' => $request->idioma
        ]);

        DispositivoUsuario::where('usuario_id', $user->id)
            ->update([
                'idioma' => $request->idioma
            ]);

        return response()->json([
            'message' => __('auth.language_updated'),
            'idioma' => $user->idioma
        ], 200);
    }

    public function me()
    {
        return response()->json(auth('api')->user());
    }

    public function logout()
    {
        auth('api')->logout();

        return response()->json(['message' => __('auth.logout_success')]);
    }

    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60
        ]);
    }
}
