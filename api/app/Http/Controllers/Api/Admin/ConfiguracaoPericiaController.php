<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConfiguracaoPericiaController extends Controller
{
    public function show()
    {
        $row = DB::table('configuracoes_pericia')->first();
        return response()->json(['data' => ['coeficiente_eur' => (float) ($row->coeficiente_eur ?? 0)]]);
    }

    public function update(Request $request)
    {
        $data = $request->validate(['coeficiente_eur' => ['required', 'numeric', 'min:0', 'max:1000000']]);
        DB::table('configuracoes_pericia')->updateOrInsert(
            ['id' => 1],
            ['coeficiente_eur' => round((float) $data['coeficiente_eur'], 2), 'updated_at' => now(), 'created_at' => now()]
        );
        return $this->show();
    }
}
