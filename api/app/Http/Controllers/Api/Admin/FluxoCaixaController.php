<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\FinanceiroStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Admin\ContaPagarResource;
use App\Http\Resources\Api\Admin\ContaReceberResource;
use App\Models\ContaPagar;
use App\Models\ContaReceber;
use Illuminate\Http\Request;

class FluxoCaixaController extends Controller
{
    public function index(Request $request)
    {
        $contasReceber = ContaReceber::query()
            ->whereIn('status', [FinanceiroStatusEnum::CONFIRMADO, FinanceiroStatusEnum::RECEBIDO])
            ->when($request->input('data_de'), function ($query, $dataDe) {
                $query->whereDate('data_vencimento', '>=', $dataDe);
            })
            ->when($request->input('data_ate'), function ($query, $dataAte) {
                $query->whereDate('data_vencimento', '<=', $dataAte);
            })
            ->get();

        $contasPagar = ContaPagar::query()
            ->whereIn('status', [FinanceiroStatusEnum::CONFIRMADO, FinanceiroStatusEnum::PAGO])
            ->when($request->input('data_de'), function ($query, $dataDe) {
                $query->whereDate('data_vencimento', '>=', $dataDe);
            })
            ->when($request->input('data_ate'), function ($query, $dataAte) {
                $query->whereDate('data_vencimento', '<=', $dataAte);
            })
            ->get();

        return response()->json([
            'data' => [
                'contasReceber' => ContaReceberResource::collection($contasReceber),
                'contasPagar' => ContaPagarResource::collection($contasPagar),
            ],
        ]);
    }
}
