<?php

namespace App\Http\Middleware\Api;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Não autenticado.'
            ], 401);
        }

        if (!in_array(strtolower($user->perfil), $permissions)) {
            return response()->json([
                'message' => 'Sem permissão para acessar este recurso.'
            ], 403);
        }

        return $next($request);
    }
}
