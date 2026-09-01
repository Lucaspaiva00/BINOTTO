<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Admin\PericiaResource;
use App\Http\Services\PericiaStorageService;
use App\Enums\PericiaStatusEnum;
use App\Models\Pericia;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PericiaController extends Controller
{
    public function __construct(
        private readonly PericiaStorageService $periciaStorageService,
    ) {
    }

    public function index(Request $request)
    {
        $pericias = Pericia::query()
            ->select([
                'id',
                'placa',
                'status',
                'tipo',
                'marca_modelo',
                'preco_sugerido',
                'valor_pericia',
                'moeda',
                'created_at',
                'oficina_id',
                'tecnico_id',
                'servico_id',
            ])
            ->with([
                'oficina:id,nome_fantasia',
                'tecnico:id,nome_completo',
            ])
            ->when($request->input('status'), function ($query, $status) {
                if (in_array($status, ['aberta', 'em_execucao', 'concluida'], true)) {
                    $query->where('status', $status);
                }
            })
            ->when($request->input('tipo'), function ($query, $tipo) {
                if (in_array($tipo, ['simples', 'completa'], true)) {
                    $query->where('tipo', $tipo);
                }
            })
            ->when($request->filled('data_inicial') && $request->filled('data_final'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->data_inicial)
                    ->whereDate('created_at', '<=', $request->data_final);
            })
            ->when($request->filled('data_inicial') && ! $request->filled('data_final'), function ($query) use ($request) {
                $query->whereDate('created_at', $request->data_inicial);
            })
            ->when($request->filled('busca'), function ($query) use ($request) {
                $term = trim($request->input('busca'));
                $plate = strtoupper(str_replace('-', '', $term));

                $query->where(function ($q) use ($term, $plate) {
                    $q->whereHas('oficina', function ($oficina) use ($term) {
                        $oficina->where('nome_fantasia', 'like', "%{$term}%");
                    })
                        ->orWhereRaw("REPLACE(UPPER(placa), '-', '') LIKE ?", ["%{$plate}%"]);

                    if (is_numeric($term)) {
                        $q->orWhere('id', $term);
                    }
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return PericiaResource::collection($pericias);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'tecnico_id' => ['nullable', 'exists:tecnicos,id'],
            'placa' => ['required', 'string', 'max:20'],
            'chassi' => ['required', 'string', 'max:30'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'in:simples,completa'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
            'reparos_necessarios' => ['nullable', 'json'],
        ]);

        $uploadedPaths = [
            'fotos' => [],
            'fotos_pericia_completa' => [],
            'fotos_reparos' => [],
        ];

        try {
            $repairsJson = json_decode($request->input('reparos_necessarios', '[]'), true) ?? [];
            $repairs = $this->periciaStorageService->normalizeRepairs($repairsJson);
            $isComplete = $data['tipo'] === 'completa';

            DB::beginTransaction();

            $pericia = Pericia::create([
                'oficina_id' => $data['oficina_id'],
                'tecnico_id' => $data['tecnico_id'] ?? null,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => $data['tipo'],
                'status' => PericiaStatusEnum::ABERTA->value,
                'moeda' => 'EUR',
                'preco_sugerido' => $isComplete ? null : ($data['preco_sugerido'] ?? null),
                'valor_pericia' => $isComplete ? ($data['valor_pericia'] ?? null) : null,
            ]);

            $attachments = $this->periciaStorageService->persistCreateAttachments(
                $request,
                $pericia->id,
                $repairs,
            );
            $uploadedPaths = $attachments['uploaded_paths'];

            $pericia->update([
                'fotos' => $attachments['fotos'],
                'fotos_pericia_completa' => $attachments['fotos_pericia_completa'],
                'reparos_necessarios' => $attachments['reparos_necessarios'],
            ]);

            DB::commit();

            $pericia = $pericia->fresh()->load([
                'oficina:id,nome_fantasia',
                'tecnico:id,nome_completo',
                'servico:id',
            ]);

            return response()->json(['data' => new PericiaResource($pericia)], 201);
        } catch (Exception $e) {
            DB::rollBack();
            $this->periciaStorageService->rollbackUploaded($uploadedPaths);

            Log::error('Erro ao criar perícia (admin)', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Erro ao criar perícia.',
            ], 500);
        }
    }

    public function show(int $id)
    {
        $pericia = Pericia::with([
            'oficina:id,nome_fantasia',
            'tecnico:id,nome_completo',
            'servico:id',
        ])->find($id);

        if (! $pericia) {
            return response()->json(['message' => 'Perícia não encontrada.'], 404);
        }

        return response()->json(['data' => new PericiaResource($pericia)]);
    }

    public function generatePdf(int $id)
    {
        try {
            $pericia = Pericia::with([
                'oficina',
                'tecnico',
                'servico',
            ])->find($id);

            if (! $pericia) {
                return response()->json(['message' => 'Perícia não encontrada.'], 404);
            }

            $pdf = Pdf::loadView('pdf.pericia', [
                'pericia' => $pericia,
                'generatedAt' => now(),
            ]);

            return $pdf->download("pericia-{$pericia->id}.pdf");
        } catch (Exception $e) {
            Log::error('Erro ao gerar pdf da perícia (admin)', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Erro ao gerar pdf da perícia.',
            ], 500);
        }
    }
}
