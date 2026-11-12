<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RegistrarMovimentacaoPainel
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($response->isSuccessful() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $route = $request->route();
            $id = $route?->parameter('id');
            if ($id === null && str_contains((string) $response->headers->get('Content-Type'), 'application/json')) {
                $id = data_get(json_decode($response->getContent(), true), 'data.id');
            }
            try {
                DB::table('painel_movimentacoes')->insert([
                    'usuario_id' => $request->user()?->id,
                    'metodo' => $request->method(),
                    'rota' => $route?->uri() ?? '',
                    'referencia' => is_scalar($id) && ctype_digit((string) $id) ? (string) $id : null,
                    'created_at' => now(),
                ]);
            } catch (\Throwable $error) {
                // The mutation has already committed. Do not cause the client to repeat it.
                report($error);
            }
        }
        return $response;
    }
}
