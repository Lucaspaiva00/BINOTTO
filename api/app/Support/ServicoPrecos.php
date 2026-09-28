<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Única fonte da regra financeira compartilhada entre painel e APP.
 * Mantém os valores lançados (tipo/valor) separados dos valores calculados.
 */
final class ServicoPrecos
{
    public const ITEMS = ['carro', 'desmontagem'];
    public const PERFIS = ['OFICINA', 'TECNICO'];

    /** Completa apenas flags ausentes de configurações legadas, nunca inventa valores. */
    public static function normalizar(array $precos): array
    {
        foreach (self::ITEMS as $item) {
            foreach (['oficina', 'tecnico'] as $lado) {
                $key = "{$lado}_{$item}";
                if (isset($precos[$key]) && is_array($precos[$key])) {
                    // A versão antiga interpretava visivel_app em TODAS as chaves como
                    // visibilidade para o técnico. Não transformar flags legadas do
                    // próprio técnico em autorização para a oficina inadvertidamente.
                    $legado = ! array_key_exists('habilitado_preenchimento_app', $precos[$key]);
                    $precos[$key]['visivel_app'] = ($legado && $lado === 'tecnico')
                        ? false : (bool) ($precos[$key]['visivel_app'] ?? false);
                    $precos[$key]['habilitado_preenchimento_app'] = (bool) ($precos[$key]['habilitado_preenchimento_app'] ?? false);
                }
            }
        }
        return $precos;
    }

    /**
     * Oficina fixa 1000, técnico 30% => técnico 300.
     * Técnico fixo 400, oficina 40% => oficina 1000 (cálculo inverso).
     * Dois valores fixos são independentes. Não aceita dois percentuais sem base.
     * Retorna null para pares legados incompletos, sem reinterpretar dados antigos.
     *
     * @return array<string,array{oficina:?float,tecnico:?float}>
     */
    public static function calcular(array $precos): array
    {
        $result = [];
        foreach (self::ITEMS as $item) {
            $oficina = $precos["oficina_{$item}"] ?? null;
            $tecnico = $precos["tecnico_{$item}"] ?? null;
            if (! is_array($oficina) || ! is_array($tecnico)) {
                $result[$item] = ['oficina' => null, 'tecnico' => null];
                continue;
            }
            foreach (['oficina' => $oficina, 'tecnico' => $tecnico] as $side => $price) {
                if (! in_array($price['tipo'] ?? null, ['valor', 'porcentagem'], true)
                    || ! isset($price['valor']) || ! is_numeric($price['valor'])
                    || ! is_finite((float) $price['valor']) || (float) $price['valor'] < 0
                    || ((($price['tipo'] ?? '') === 'porcentagem') && (float) $price['valor'] > 100)) {
                    throw new InvalidArgumentException("Preço inválido para {$side} / {$item}.");
                }
            }
            $tipoOficina = $oficina['tipo'];
            $tipoTecnico = $tecnico['tipo'];
            $valorOficina = (float) $oficina['valor'];
            $valorTecnico = (float) $tecnico['valor'];
            if ($tipoOficina === 'porcentagem' && $tipoTecnico === 'porcentagem') {
                throw new InvalidArgumentException("Informe um valor fixo para pelo menos um dos lados de {$item}.");
            }
            if ($tipoOficina === 'porcentagem' && $valorOficina == 0.0) {
                throw new InvalidArgumentException("O percentual da oficina para {$item} deve ser maior que zero para o cálculo inverso.");
            }
            if ($tipoOficina === 'valor' && $tipoTecnico === 'porcentagem') {
                $result[$item] = ['oficina' => round($valorOficina, 2), 'tecnico' => round($valorOficina * $valorTecnico / 100, 2)];
            } elseif ($tipoOficina === 'porcentagem' && $tipoTecnico === 'valor') {
                $result[$item] = ['oficina' => round($valorTecnico * 100 / $valorOficina, 2), 'tecnico' => round($valorTecnico, 2)];
            } else {
                $result[$item] = ['oficina' => round($valorOficina, 2), 'tecnico' => round($valorTecnico, 2)];
            }
            if (($result[$item]['oficina'] ?? 0) > 99999999 || ($result[$item]['tecnico'] ?? 0) > 99999999) {
                throw new InvalidArgumentException("Preço calculado excede o máximo permitido para {$item}.");
            }
        }
        return $result;
    }

    /** Dados antigos inconsistentes continuam legíveis até que o administrador corrija a configuração. */
    public static function calcularSeguro(array $precos): array
    {
        try {
            return self::calcular($precos);
        } catch (InvalidArgumentException $e) {
            return array_fill_keys(self::ITEMS, ['oficina' => null, 'tecnico' => null]);
        }
    }

    /** Valores ocultos não são expostos nem como valor bruto nem como valor calculado. */
    public static function paraPerfil(array $precos, string $perfil): array
    {
        $precos = self::normalizar($precos);
        if (! in_array($perfil, self::PERFIS, true)) return $precos;
        $ladoProprio = $perfil === 'TECNICO' ? 'tecnico' : 'oficina';
        $resultado = [];
        foreach ($precos as $key => $config) {
            if (! is_array($config)) continue;
            $proprio = str_starts_with((string) $key, "{$ladoProprio}_");
            // Habilitação é diferente de compartilhar o preço com o outro perfil.
            $permitido = $proprio
                ? (bool) ($config['habilitado_preenchimento_app'] ?? false)
                : (bool) ($config['visivel_app'] ?? false);
            $resultado[$key] = $permitido ? $config : null;
        }
        return $resultado;
    }

    public static function calculadosParaPerfil(array $precos, string $perfil): array
    {
        $calculados = self::calcularSeguro($precos);
        $visiveis = self::paraPerfil($precos, $perfil);
        if (! in_array($perfil, self::PERFIS, true)) return $calculados;
        foreach (self::ITEMS as $item) {
            foreach (['oficina', 'tecnico'] as $lado) {
                if (($visiveis["{$lado}_{$item}"] ?? null) === null) {
                    $calculados[$item][$lado] = null;
                }
            }
        }
        return $calculados;
    }
}
