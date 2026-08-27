<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PericiaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status?->value,
            'statusLabel' => $this->status?->label(),
            'tipo' => $this->tipo,
            'licensePlate' => $this->placa,
            'model' => $this->marca_modelo,
            'workshop' => $this->oficina?->nome_fantasia,
            'technician' => $this->tecnico?->nome_completo,
            'serviceId' => $this->servico_id,
            'currency' => $this->moeda,
            'suggestedPrice' => $this->preco_sugerido !== null ? (float) $this->preco_sugerido : null,
            'inspectionValue' => $this->valor_pericia !== null ? (float) $this->valor_pericia : null,
            'createdAt' => $this->created_at,
            'chassis' => $this->when(
                array_key_exists('chassi', $this->resource->getAttributes()),
                $this->chassi,
            ),
            'photos' => $this->when(
                array_key_exists('fotos', $this->resource->getAttributes()),
                fn () => $this->mapPhotoMap($this->fotos),
            ),
            'completePhotos' => $this->when(
                array_key_exists('fotos_pericia_completa', $this->resource->getAttributes()),
                fn () => $this->mapPhotoMap($this->fotos_pericia_completa),
            ),
            'repairs' => $this->when(
                array_key_exists('reparos_necessarios', $this->resource->getAttributes()),
                fn () => $this->mapRepairs($this->reparos_necessarios ?? []),
            ),
        ];
    }

    /**
     * @param  array<string, string>|null  $photos
     * @return array<string, string>
     */
    private function mapPhotoMap(?array $photos): array
    {
        if (! $photos) {
            return [];
        }

        $mapped = [];

        foreach ($photos as $key => $path) {
            if (is_string($path) && $path !== '') {
                $mapped[$key] = $this->photoUrl($path);
            }
        }

        return $mapped;
    }

    /**
     * @param  array<int, array<string, mixed>>  $repairs
     * @return array<int, array<string, mixed>>
     */
    private function mapRepairs(array $repairs): array
    {
        return collect($repairs)->map(function ($repair) {
            $photos = collect($repair['fotos'] ?? [])
                ->filter(fn ($path) => is_string($path) && $path !== '')
                ->map(fn (string $path) => $this->photoUrl($path))
                ->values()
                ->all();

            return [
                'part' => $repair['peca'] ?? null,
                'repairType' => $repair['tipoReparo'] ?? $repair['tipo_reparo'] ?? 'SEM_DANO',
                'dentCount' => (int) ($repair['quantidadeAmassados'] ?? 0),
                'impactsOver25' => (int) ($repair['quantidadeImpactosMaior25'] ?? 0),
                'impactsUnder25' => (int) ($repair['quantidadeImpactosMenor25'] ?? 0),
                'notes' => $repair['observacoes'] ?? '',
                'photos' => $photos,
            ];
        })->values()->all();
    }

    private function photoUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
