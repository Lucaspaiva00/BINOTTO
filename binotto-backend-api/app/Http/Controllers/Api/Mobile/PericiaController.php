<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Enums\PericiaStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\Pericia;
use App\Models\ServicoVeiculo;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PericiaController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $status = $request->input('status');

        $query = Pericia::select([
            'id',
            'placa',
            'status',
            'marca_modelo',
            'preco_sugerido',
            'valor_pericia',
            'created_at',
            'oficina_id',
            'servico_id',
        ])
            ->with([
                'oficina:id,nome_fantasia',
            ]);

        if ($user->tecnico) {
            $query->where('tecnico_id', $user->tecnico->id);
        }

        if ($user->oficina) {
            $query->where('oficina_id', $user->oficina->id);
        }

        if ($status && in_array($status, ['aberta', 'em_execucao', 'concluida'])) {
            $query->where('status', $status);
        }

        if ($request->filled('data_inicial') && $request->filled('data_final')) {
            $query->whereDate('created_at', '>=', $request->data_inicial)
                ->whereDate('created_at', '<=', $request->data_final);
        } elseif ($request->filled('data_inicial')) {
            $query->whereDate('created_at', $request->data_inicial);
        }

        if ($request->filled('oficina_placa')) {
            $term = trim($request->oficina_placa);
            $plate = strtoupper(str_replace('-', '', $term));

            $query->where(function ($q) use ($term, $plate) {
                $q->whereHas('oficina', function ($oficina) use ($term) {
                    $oficina->where('nome_fantasia', 'like', "%{$term}%");
                })
                    ->orWhereRaw("REPLACE(UPPER(placa), '-', '') LIKE ?", ["%{$plate}%"]);
            });
        }

        $pericias = $query
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $pericias,
        ]);
    }

    public function show(int $id)
    {
        try {
            $user = auth()->user();

            $query = Pericia::with([
                'oficina:id,nome_fantasia',
                'tecnico:id,nome_completo',
            ]);

            if ($user->tecnico) {
                $query->where('tecnico_id', $user->tecnico->id);
            }

            if ($user->oficina) {
                $query->where('oficina_id', $user->oficina->id);
            }

            $pericia = $query->find($id);

            if (!$pericia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perícia não encontrada.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pericia,
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao buscar perícia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar perícia.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function generatePdf(int $id)
    {
        try {
            $user = auth()->user();

            $query = Pericia::with([
                'oficina',
                'tecnico',
                'servico',
            ]);

            if ($user->tecnico) {
                $query->where('tecnico_id', $user->tecnico->id);
            }

            if ($user->oficina) {
                $query->where('oficina_id', $user->oficina->id);
            }

            $pericia = $query->find($id);

            if (!$pericia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perícia não encontrada.',
                ], 404);
            }


            $pdf = Pdf::loadView(
                'pdf.pericia',
                [
                    'pericia' => $pericia,
                    'generatedAt' => now()
                ]
            );

            return $pdf->download("pericia-{$pericia->id}.pdf");
        } catch (Exception $e) {
            Log::error('Erro ao gerar pdf da perícia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar pdf da perícia.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
