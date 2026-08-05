<?php

namespace App\Http\Controllers\Api\Mobile\Oficina;

use App\Enums\PericiaStatusEnum;
use App\Enums\ServicoLogTipoEnum;
use App\Http\Controllers\Controller;
use App\Models\Pericia;
use App\Models\ServicoLog;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OficinaPericiaController extends Controller
{

    public function store(Request $request)
    {
        $data = $request->validate([
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string'],
            'chassi' => ['required', 'string'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0']
        ]);

        $uploadedFotosBasePaths = [];
        $uploadedFotosPericiaPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            DB::beginTransaction();

            $pericia = Pericia::create([
                'oficina_id' => $oficina->id,
                'servico_id' => $data['servico_id'] ?? null,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => "completa",
                'status' => PericiaStatusEnum::ABERTA->value,
                'moeda' => 'EUR',
                'preco_sugerido' => null,
                'valor_pericia' => $data['valor_pericia'] ?? null,
            ]);

            if ($pericia->servico_id) {
                ServicoLog::create([
                    'servico_id' => $pericia->servico_id,
                    'pericia_id' => $pericia->id,
                    'oficina_id' => $oficina->id,
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
            'servico_id' => ['nullable', 'exists:servicos,id'],
            'placa' => ['required', 'string'],
            'chassi' => ['required', 'string'],
            'marca_modelo' => ['required', 'string', 'max:255'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0']
        ]);

        $uploadedFotosPericiaSimplesPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            DB::beginTransaction();

            $pericia = Pericia::create([
                'oficina_id' => $oficina->id,
                'servico_id' => $data['servico_id'] ?? null,
                'placa' => $data['placa'],
                'chassi' => $data['chassi'],
                'marca_modelo' => $data['marca_modelo'],
                'tipo' => "simples",
                'status' => PericiaStatusEnum::ABERTA->value,
                'moeda' => 'EUR',
                'preco_sugerido' => $data['preco_sugerido'] ?? null,
                'valor_pericia' => null,
            ]);

            if ($pericia->servico_id) {
                ServicoLog::create([
                    'servico_id' => $pericia->servico_id,
                    'pericia_id' => $pericia->id,
                    'oficina_id' => $oficina->id,
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

    private function salvarFotosPericia(?array $files, int $periciaId, bool $periciaCompleta = false): array
    {
        $paths = [];

        $folder = $periciaCompleta ? 'fotos-pericia-completa' : 'fotos';

        foreach ($files as $tipo => $file) {
            if (!$file) {
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
                if (!$file) continue;

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
            if (!is_array($files)) {
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

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'placa' => ['sometimes', 'string'],
            'chassi' => ['sometimes', 'string'],
            'marca_modelo' => ['sometimes', 'string', 'max:255'],
            'preco_sugerido' => ['nullable', 'numeric', 'min:0'],
            'valor_pericia' => ['nullable', 'numeric', 'min:0'],
            'tipo' => ['sometimes', 'in:simples,completa'],
            'reparos_necessarios' => ['sometimes', 'json'],
        ]);

        $uploadedFotosPaths = [];
        $uploadedFotosPericiaPaths = [];
        $uploadedFotosReparosPaths = [];

        try {
            $user = auth()->user();
            $oficina = $user->oficina;

            $pericia = Pericia::where('id', $id)
                ->where('oficina_id', $oficina->id)
                ->firstOrFail();

            DB::beginTransaction();

            $pericia->update([
                'placa' => $data['placa'] ?? $pericia->placa,
                'chassi' => $data['chassi'] ?? $pericia->chassi,
                'marca_modelo' => $data['marca_modelo'] ?? $pericia->marca_modelo,
                'tipo' => $data['tipo'] ?? $pericia->tipo,
                'preco_sugerido' => $data['preco_sugerido'] ?? $pericia->preco_sugerido,
                'valor_pericia' => $data['valor_pericia'] ?? $pericia->valor_pericia,
            ]);

            // Fotos base
            if ($request->hasFile('fotos')) {
                $uploadedFotosPaths = $this->salvarFotosPericia($request->file('fotos'), $pericia->id);
                $fotosAtuais = $pericia->fotos ?? [];
                $pericia->fotos = array_merge($fotosAtuais, $uploadedFotosPaths);
            }

            // Fotos perícia completa
            if ($request->hasFile('fotos_pericia_completa')) {
                $uploadedFotosPericiaPaths = $this->salvarFotosPericia($request->file('fotos_pericia_completa'), $pericia->id, true);
                $fotosCompletaAtuais = $pericia->fotos_pericia_completa ?? [];
                $pericia->fotos_pericia_completa = array_merge($fotosCompletaAtuais, $uploadedFotosPericiaPaths);
            }

            // Reparos
            $reparosNecessariosJson = json_decode($request->input('reparos_necessarios', '[]'), true);
            $reparosAtuais = $pericia->reparos_necessarios ?? [];

            if ($request->hasFile('fotos_reparos')) {
                $uploadedFotosReparosPaths = $this->salvarFotosReparos($request->file('fotos_reparos'), $pericia->id);
            }

            $reparosNecessarios = $this->normalizeReparos($reparosNecessariosJson, $reparosAtuais);

            foreach ($reparosNecessarios as &$reparo) {
                $peca = $reparo['peca'];
                $novasFotos = $uploadedFotosReparosPaths[$peca] ?? [];
                $reparo['fotos'] = array_merge($reparo['fotos'] ?? [], $novasFotos);
            }

            $pericia->reparos_necessarios = $reparosNecessarios;

            // Remoção de fotos (opcional)
            if ($request->filled('fotos_remover')) {
                $fotosRemover = json_decode($request->input('fotos_remover'), true);
                $this->removerFotosArray($fotosRemover, $pericia, 'fotos');
            }

            if ($request->filled('fotos_reparos_remover')) {
                $fotosReparoRemover = json_decode($request->input('fotos_reparos_remover'), true);
                $this->removerFotosReparosArray($fotosReparoRemover, $pericia);
            }

            $pericia->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => __('main.pericia_update_success'),
                'data' => $pericia->fresh(),
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
}
