<?php

namespace App\Http\Controllers\Api\Mobile\Tecnico;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoLogTipoEnum;
use App\Http\Controllers\Controller;
use App\Models\Oficina;
use App\Models\Pericia;
use App\Models\ServicoLog;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TecnicoPericiaController extends Controller
{
    public function searchByPlate(Request $request)
    {
        $data = $request->validate([
            'placa' => ['required', 'string'],
        ]);

        $pericias = Pericia::select([
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
            ])
            ->where('placa', 'like', "%{$data['placa']}%")
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pericias,
        ]);
    }

    public function showByPlate(string $placa)
    {
        $placa = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($placa));

        $pericias = Pericia::where('placa', $placa)
            ->where('status', PericiaStatusEnum::ABERTA)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pericias,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string'],
            'chassi' => ['required', 'string'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
        ]);

        $uploadedFotosBasePaths = [];
        $uploadedFotosPericiaPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;
            $oficina = Oficina::find($data['oficina_id']);

            DB::beginTransaction();

            $pericia = Pericia::create([
                'tecnico_id' => $tecnico->id,
                'oficina_id' => $oficina->id,
                'servico_id' => $data['servico_id'] ?? null,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => 'completa',
                'status' => PericiaStatusEnum::ABERTA->value,
                'moeda' => 'EUR',
                'preco_sugerido' => null,
                'valor_pericia' => $data['valor_pericia'] ?? null,
            ]);

            if ($pericia->servico_id) {
                ServicoLog::create([
                    'servico_id' => $pericia->servico_id,
                    'pericia_id' => $pericia->id,
                    'tecnico_id' => $tecnico->id,
                    'tipo' => ServicoLogTipoEnum::PERICIA_CRIADA,
                    'descricao' => 'Perícia completa registrada',
                    'payload' => [
                        'placa' => $pericia->placa,
                        'chassi' => $pericia->chassi,
                        'marca_modelo' => $pericia->marca_modelo,
                        'valor_pericia' => $pericia->valor_pericia,
                    ],
                ]);
            }

            // Fotos Base
            if ($request->hasFile('fotos')) {
                $uploadedFotosBasePaths = $this->salvarFotosPericia(
                    $request->file('fotos'),
                    $pericia->id,
                );

                $pericia->update([
                    'fotos' => $uploadedFotosBasePaths,
                ]);
            }

            // Fotos da perícia
            if ($request->hasFile('fotos_pericia_completa')) {
                $uploadedFotosPericiaPaths = $this->salvarFotosPericia(
                    $request->file('fotos_pericia_completa'),
                    $pericia->id,
                    true
                );

                $pericia->update([
                    'fotos_pericia_completa' => $uploadedFotosPericiaPaths,
                ]);
            }

            // Salva reparos com fotos
            $fotosReparos = $this->salvarFotosReparos($request->file('fotos_reparos', []), $pericia->id);
            $uploadedFotosReparosPaths = $fotosReparos;
            $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
            $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson);

            foreach ($reparosNecessarios as &$reparo) {
                $peca = $reparo['peca'];
                $fotos = $fotosReparos[$peca] ?? [];
                $reparo['fotos'] = array_values($fotos);
            }

            $pericia->update([
                'reparos_necessarios' => $reparosNecessarios,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.pericia_create_success'),
                'data' => $pericia->fresh()->load([
                    'oficina:id,nome_fantasia',
                    'tecnico:id,nome_completo',
                ]),
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotos($uploadedFotosBasePaths);
            $this->removerFotos($uploadedFotosPericiaPaths);
            $this->removerFotosReparos($uploadedFotosReparosPaths);

            Log::error('Erro ao criar perícia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.pericia_create_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeSimple(Request $request)
    {
        $data = $request->validate([
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string'],
            'chassi' => ['required', 'string'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
        ]);

        $uploadedFotosPericiaSimplesPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;
            $oficina = Oficina::find($data['oficina_id']);

            DB::beginTransaction();

            $pericia = Pericia::create([
                'tecnico_id' => $tecnico->id,
                'oficina_id' => $oficina->id,
                'servico_id' => $data['servico_id'] ?? null,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => 'simples',
                'status' => PericiaStatusEnum::ABERTA->value,
                'moeda' => 'EUR',
                'preco_sugerido' => $data['preco_sugerido'] ?? null,
                'valor_pericia' => null,
            ]);

            if ($pericia->servico_id) {
                ServicoLog::create([
                    'servico_id' => $pericia->servico_id,
                    'pericia_id' => $pericia->id,
                    'tecnico_id' => $tecnico->id,
                    'tipo' => ServicoLogTipoEnum::PERICIA_CRIADA,
                    'descricao' => 'Perícia simples registrada',
                    'payload' => [
                        'placa' => $pericia->placa,
                        'chassi' => $pericia->chassi,
                        'marca_modelo' => $pericia->marca_modelo,
                        'preco_sugerido' => $pericia->preco_sugerido,
                    ],
                ]);
            }

            // Fotos da perícia
            if ($request->hasFile('fotos')) {
                $uploadedFotosPericiaSimplesPaths = $this->salvarFotosPericia(
                    $request->file('fotos'),
                    $pericia->id
                );

                $pericia->update([
                    'fotos' => $uploadedFotosPericiaSimplesPaths,
                ]);
            }

            // Salva reparos com fotos
            $fotosReparos = $this->salvarFotosReparos($request->file('fotos_reparos', []), $pericia->id);
            $uploadedFotosReparosPaths = $fotosReparos;
            $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
            $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson);

            foreach ($reparosNecessarios as &$reparo) {
                $peca = $reparo['peca'];
                $fotos = $fotosReparos[$peca] ?? [];
                $reparo['fotos'] = array_values($fotos);
            }

            $pericia->update([
                'reparos_necessarios' => $reparosNecessarios,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.pericia_create_success'),
                'data' => $pericia->fresh()->load([
                    'oficina:id,nome_fantasia',
                    'tecnico:id,nome_completo',
                ]),
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotos($uploadedFotosPericiaSimplesPaths);
            $this->removerFotosReparos($uploadedFotosReparosPaths);

            Log::error('Erro ao criar perícia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.pericia_create_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'oficina_id' => ['required', 'exists:oficinas,id'],
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string', 'max:255'],
            'chassi' => ['required', 'string', 'max:255'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'tipo' => ['required', 'string', 'in:completa,simples'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
            'reparos_necessarios' => ['required', 'json'],
            'fotos_remover' => ['nullable', 'json'],
            'fotos_reparos_remover' => ['nullable', 'json'],
            'fotos_pericia_completa_remover' => ['nullable', 'json'],
        ]);

        $uploadedFotosPaths = [];
        $uploadedFotosPericiaPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $tecnico = $user->tecnico;

            $pericia = Pericia::where('id', $id)
                ->where('oficina_id', $data['oficina_id'])
                ->firstOrFail();

            DB::beginTransaction();

            // Fotos base
            $fotos = $pericia->fotos ?? [];
            $fotosRemover = json_decode($request->input('fotos_remover', '[]'), true) ?? [];

            if (!empty($fotosRemover)) {
                $this->removerFotos($fotosRemover);
                $fotos = array_diff($fotos, $fotosRemover);
            }

            if ($request->hasFile('fotos')) {
                $uploadedFotosPaths = $this->salvarFotosPericia(
                    $request->file('fotos'),
                    $pericia->id,
                );

                $fotos = array_merge($fotos, $uploadedFotosPaths);
            }

            // Fotos da perícia completa
            $fotosPericiaCompleta = $pericia->fotos_pericia_completa ?? [];
            $fotosPericiaCompletaRemover = json_decode($request->input('fotos_pericia_completa_remover', '[]'), true) ?? [];

            if (!empty($fotosPericiaCompletaRemover)) {
                $this->removerFotos($fotosPericiaCompletaRemover);
                $fotosPericiaCompleta = array_diff($fotosPericiaCompleta, $fotosPericiaCompletaRemover);
            }

            if ($request->hasFile('fotos_pericia_completa')) {
                $uploadedFotosPericiaPaths = $this->salvarFotosPericia(
                    $request->file('fotos_pericia_completa'),
                    $pericia->id,
                    true
                );

                $fotosPericiaCompleta = array_merge($fotosPericiaCompleta, $uploadedFotosPericiaPaths);
            }

            // Fotos dos reparos
            $reparosNecessariosAtuais = collect($pericia->reparos_necessarios ?? [])->keyBy('peca');
            $fotosReparosRemover = json_decode($request->input('fotos_reparos_remover', '[]'), true) ?? [];

            if (!empty($fotosReparosRemover)) {
                $this->removerFotosReparos(
                    collect($fotosReparosRemover)->groupBy('partId')
                        ->map(fn ($itens) => $itens->pluck('path')->all())
                        ->all()
                );
            }

            $fotosReparosNovas = $this->salvarFotosReparos($request->file('fotos_reparos', []), $pericia->id);
            $uploadedFotosReparosPaths = $fotosReparosNovas;

            $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
            $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson);

            foreach ($reparosNecessarios as &$reparo) {
                $peca = $reparo['peca'];

                $fotosExistentes = $reparosNecessariosAtuais->get($peca)['fotos'] ?? [];
                $pathsRemoverPeca = collect($fotosReparosRemover)
                    ->where('partId', $peca)
                    ->pluck('path')
                    ->all();

                if (! empty($pathsRemoverPeca)) {
                    $fotosExistentes = array_diff($fotosExistentes, $pathsRemoverPeca);
                }

                $fotosNovas = $fotosReparosNovas[$peca] ?? [];
                $reparo['fotos'] = array_values(array_merge($fotosExistentes, $fotosNovas));
            }
            unset($reparo);

            $pericia->update([
                'oficina_id' => $data['oficina_id'],
                'servico_id' => $data['servico_id'] ?? null,
                'tecnico_id' => $tecnico->id,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => $data['tipo'],
                'preco_sugerido' => $data['tipo'] === 'simples' ? ($data['preco_sugerido'] ?? null) : null,
                'valor_pericia' => $data['tipo'] === 'completa' ? ($data['valor_pericia'] ?? null) : null,
                'fotos' => $fotos,
                'fotos_pericia_completa' => $fotosPericiaCompleta,
                'reparos_necessarios' => $reparosNecessarios,
            ]);

            if ($pericia->servico_id) {
                ServicoLog::create([
                    'servico_id' => $pericia->servico_id,
                    'pericia_id' => $pericia->id,
                    'tecnico_id' => $tecnico->id,
                    'tipo' => ServicoLogTipoEnum::PERICIA_ATUALIZADA,
                    'descricao' => $data['tipo'] === 'completa' ? 'Perícia completa atualizada' : 'Perícia simples atualizada',
                    'payload' => [
                        'placa' => $pericia->placa,
                        'chassi' => $pericia->chassi,
                        'marca_modelo' => $pericia->marca_modelo,
                        'preco_sugerido' => $pericia->preco_sugerido,
                        'valor_pericia' => $pericia->valor_pericia,
                    ],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.pericia_update_success'),
                'data' => $pericia->fresh()->load([
                    'oficina:id,nome_fantasia',
                    'tecnico:id,nome_completo',
                ]),
            ]);

        } catch (Exception $e) {
            DB::rollBack();

            $this->removerFotos($uploadedFotosPaths);
            $this->removerFotos($uploadedFotosPericiaPaths);
            $this->removerFotosReparos($uploadedFotosReparosPaths);

            Log::error('Erro ao atualizar perícia', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => __('main.pericia_update_error'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function salvarFotosPericia(?array $files, int $periciaId, bool $periciaCompleta = false): array
    {
        $paths = [];

        $folder = $periciaCompleta ? 'fotos-pericia-completa' : 'fotos';

        foreach ($files as $tipo => $file) {
            if (! $file) {
                continue;
            }

            $path = $file->store("pericias/{$periciaId}/{$folder}", 'public');
            $paths[$tipo] = $path;
        }

        return $paths;
    }

    private function salvarFotosReparos(array $fotosReparos, int $periciaId): array
    {
        $result = [];

        foreach ($fotosReparos as $peca => $files) {
            foreach ($files as $file) {
                if (! $file) {
                    continue;
                }

                $path = $file->store("pericias/{$periciaId}/reparos/{$peca}", 'public');

                $result[$peca][] = $path;
            }
        }

        return $result;
    }

    private function removerFotos(array $paths): void
    {
        foreach ($paths as $path) {
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function removerFotosReparos(array $fotosReparos): void
    {
        foreach ($fotosReparos as $peca => $files) {
            if (! is_array($files)) {
                continue;
            }

            foreach ($files as $path) {
                if ($path && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }
    }

    private function normalizeReparos(array $reparos): array
    {
        return array_map(function ($reparo) {
            return [
                'peca' => $reparo['peca'] ?? null,
                'tipoReparo' => $reparo['tipoReparo'] ?? 'SEM_DANO',
                'quantidadeAmassados' => $reparo['quantidadeAmassados'] ?? 0,
                'quantidadeImpactosMaior25' => $reparo['quantidadeImpactosMaior25'] ?? 0,
                'quantidadeImpactosMenor25' => $reparo['quantidadeImpactosMenor25'] ?? 0,
                'tamanhoAmassado' => $reparo['tamanhoAmassado'] ?? null,
                'coeficiente' => $reparo['coeficiente'] ?? 0,
                'observacoes' => $reparo['observacoes'] ?? '',
                'fotos' => [],
            ];
        }, $reparos);
    }
}
