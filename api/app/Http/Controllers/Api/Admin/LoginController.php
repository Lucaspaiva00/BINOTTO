<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\LoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (!$user) {
            return response()->json(['message' => __('auth.invalid_credentials')], 401);
        }

        if (!$user->ativo) {
            return response()->json(['message' => __('auth.inactive_user')], 403);
        }

        if (
            !Hash::check($request->validated('senha'), $user->senha)
            || $user->perfil !== 'ADMIN'
        ) {
            return response()->json(['message' => __('auth.invalid_credentials')], 401);
        }

        $token = auth('api')->login($user);

        return response()->json([
            'status' => 'AUTHENTICATED',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => [
                'id' => $user->id,
                'name' => $user->nome,
                'email' => $user->email,
                'profile' => $user->perfil,
                'active' => $user->ativo,
            ],
        ], 200);
    }
}
