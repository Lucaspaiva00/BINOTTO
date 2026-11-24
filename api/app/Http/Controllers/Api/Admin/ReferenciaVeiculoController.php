<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Support\ReferenciaVeiculo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferenciaVeiculoController extends Controller
{
    public function show()
    {
        return response()->json(['data' => ReferenciaVeiculo::obter()]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['referencia' => ['required', 'in:placa,chassi,ambos']]);

        DB::table('configuracoes_pericia')->upsert(
            [['id' => 1, 'referencia_veiculo' => $data['referencia'], 'created_at' => now(), 'updated_at' => now()]],
            ['id'],
            ['referencia_veiculo', 'updated_at'],
        );

        return $this->show();
    }
}
