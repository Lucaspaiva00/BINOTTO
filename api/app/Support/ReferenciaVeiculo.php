<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class ReferenciaVeiculo
{
    public static function obter(): string
    {
        return DB::table('configuracoes_pericia')->where('id', 1)->value('referencia_veiculo') ?? 'placa';
    }

    public static function regras(): array
    {
        $referencia = self::obter();

        return [
            'placa' => [$referencia === 'chassi' ? 'nullable' : 'required', 'string', 'max:20'],
            'chassi' => [$referencia === 'placa' ? 'nullable' : 'required', 'string', 'max:80'],
        ];
    }
}
