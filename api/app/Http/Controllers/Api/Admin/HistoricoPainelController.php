<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class HistoricoPainelController extends Controller
{
    public function index()
    {
        $painel = DB::table('painel_movimentacoes')
            ->selectRaw("'painel' as origem, id, usuario_id, metodo, rota, referencia, NULL as descricao, created_at");
        $servicos = DB::table('servico_logs')
            ->where('descricao', 'like', 'Administrador%')
            ->selectRaw("'servico' as origem, id, NULL as usuario_id, NULL as metodo, 'api/admin/servicos/{id}' as rota, CAST(servico_id AS VARCHAR) as referencia, descricao, created_at");

        return response()->json(DB::query()->fromSub($painel->unionAll($servicos), 'historico')
            ->orderByDesc('created_at')->orderByDesc('id')->orderBy('origem')->paginate(30));
    }
}
