<?php

namespace App\Support;

use App\Models\Servico;

final class ServicoFotosVeiculo
{
    public const CAMPOS = ['frente_motorista', 'traseira_carona', 'placa', 'chassi', 'marca', 'modelo'];

    public static function daPericia(Servico $servico): array
    {
        if (! $servico->relationLoaded('pericias')) {
            return [];
        }

        $fotos = [];
        foreach ($servico->pericias->sortByDesc('id') as $pericia) {
            $base = $pericia->fotos ?? [];
            $completa = $pericia->fotos_pericia_completa ?? [];
            $candidatas = [
                'frente_motorista' => $base['diagonalFrontDriver'] ?? null,
                'traseira_carona' => $base['diagonalRearPassenger'] ?? null,
                'placa' => $base['vehicle_plate'] ?? $base['plateOrChassis'] ?? null,
                'chassi' => $base['vehicle_chassis'] ?? $completa['chassis'] ?? null,
                'marca' => $base['vehicle_brand'] ?? null,
                'modelo' => $base['vehicle_model'] ?? null,
            ];

            foreach ($candidatas as $campo => $path) {
                if (is_string($path) && $path !== '') {
                    $fotos[$campo] ??= $path;
                }
            }
        }

        return $fotos;
    }
}
