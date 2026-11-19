<?php

namespace App\Support;

final class PericiaEspecificacoes
{
    public static function normalizar(mixed $entrada): ?array
    {
        if (! is_array($entrada)) {
            return null;
        }

        $especificacoes = [];
        foreach (['amassadosMenor25', 'amassados25a50', 'amassadosMaior50'] as $campo) {
            if (array_key_exists($campo, $entrada)) {
                $valor = filter_var($entrada[$campo], FILTER_VALIDATE_INT, [
                    'options' => ['min_range' => 0, 'max_range' => 9999],
                ]);
                $especificacoes[$campo] = $valor === false ? null : $valor;
            }
        }

        foreach (['cola', 'aluminio'] as $campo) {
            if (isset($entrada[$campo]) && is_bool($entrada[$campo])) {
                $especificacoes[$campo] = $entrada[$campo];
            }
        }

        if (array_key_exists('total', $entrada)) {
            $total = $entrada['total'];
            $especificacoes['total'] = is_numeric($total) && $total >= 0 && $total <= 99999999
                ? round((float) $total, 2) : null;
        }

        return $especificacoes;
    }
}
