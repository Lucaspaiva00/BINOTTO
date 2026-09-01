<?php

namespace App\Http\Services;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PericiaStorageService
{
    public function saveInspectionPhotos(?array $files, int $periciaId, bool $completeInspection = false): array
    {
        $paths = [];
        $folder = $completeInspection ? 'fotos-pericia-completa' : 'fotos';

        foreach ($files ?? [] as $tipo => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $paths[$tipo] = $file->store("pericias/{$periciaId}/{$folder}", 'public');
        }

        return $paths;
    }

    public function saveRepairPhotos(array $repairPhotos, int $periciaId): array
    {
        $result = [];

        foreach ($repairPhotos as $peca => $files) {
            foreach ($files ?? [] as $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $result[$peca][] = $file->store("pericias/{$periciaId}/reparos/{$peca}", 'public');
            }
        }

        return $result;
    }

    public function normalizeRepairs(array $repairs): array
    {
        return array_map(function ($repair) {
            return [
                'peca' => $repair['peca'] ?? null,
                'tipoReparo' => $repair['tipoReparo'] ?? 'SEM_DANO',
                'quantidadeAmassados' => $repair['quantidadeAmassados'] ?? 0,
                'quantidadeImpactosMaior25' => $repair['quantidadeImpactosMaior25'] ?? 0,
                'quantidadeImpactosMenor25' => $repair['quantidadeImpactosMenor25'] ?? 0,
                'tamanhoAmassado' => $repair['tamanhoAmassado'] ?? null,
                'coeficiente' => $repair['coeficiente'] ?? 0,
                'observacoes' => $repair['observacoes'] ?? '',
                'fotos' => [],
            ];
        }, $repairs);
    }

    public function attachRepairPhotos(array $repairs, array $repairPhotoPaths): array
    {
        foreach ($repairs as &$repair) {
            $part = $repair['peca'] ?? null;
            $repair['fotos'] = array_values($repairPhotoPaths[$part] ?? []);
        }

        unset($repair);

        return $repairs;
    }

    public function persistCreateAttachments(Request $request, int $periciaId, array $repairs): array
    {
        $fotos = $request->hasFile('fotos')
            ? $this->saveInspectionPhotos($request->file('fotos'), $periciaId)
            : [];

        $fotosPericiaCompleta = $request->hasFile('fotos_pericia_completa')
            ? $this->saveInspectionPhotos($request->file('fotos_pericia_completa'), $periciaId, true)
            : [];

        $fotosReparos = $request->hasFile('fotos_reparos')
            ? $this->saveRepairPhotos($request->file('fotos_reparos', []), $periciaId)
            : [];

        $repairs = $this->attachRepairPhotos($repairs, $fotosReparos);

        return [
            'fotos' => $fotos,
            'fotos_pericia_completa' => $fotosPericiaCompleta,
            'reparos_necessarios' => $repairs,
            'uploaded_paths' => [
                'fotos' => array_values($fotos),
                'fotos_pericia_completa' => array_values($fotosPericiaCompleta),
                'fotos_reparos' => $fotosReparos,
            ],
        ];
    }

    public function deletePhotos(array $paths): void
    {
        foreach ($paths as $path) {
            if (is_string($path) && $path !== '' && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    public function deleteRepairPhotos(array $repairPhotos): void
    {
        foreach ($repairPhotos as $files) {
            if (! is_array($files)) {
                continue;
            }

            $this->deletePhotos($files);
        }
    }

    public function rollbackUploaded(array $uploadedPaths): void
    {
        $this->deletePhotos($uploadedPaths['fotos'] ?? []);
        $this->deletePhotos($uploadedPaths['fotos_pericia_completa'] ?? []);
        $this->deleteRepairPhotos($uploadedPaths['fotos_reparos'] ?? []);
    }
}
