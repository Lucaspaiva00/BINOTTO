<?php

namespace App\Http\Middleware\Api;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth('api')->user();

        if ($user && $user->idioma) {
            App::setLocale(substr($user->idioma, 0, 2));
        } else {
            $locale = $request->header('Accept-Language') ?? $request->input('idioma', 'pt');
            $locale = substr($locale, 0, 2);
            $supported = ['pt', 'en', 'fr', 'it'];
            App::setLocale(in_array($locale, $supported) ? $locale : 'pt');
        }

        return $next($request);
    }
}
