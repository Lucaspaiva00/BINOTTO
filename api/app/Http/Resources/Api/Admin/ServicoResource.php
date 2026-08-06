<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServicoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status?->value,
            'statusLabel' => $this->status?->label(),
            'workshop' => $this->oficina?->nome_fantasia,
            'workshopCity' => $this->oficina?->cidade,
            'workshopCountry' => $this->oficina?->pais,
            'technician' => $this->tecnico?->nome_completo,
            'createdBy' => $this->nomeCriadoPor(),
            'licensePlate' => $this->placa,
            'model' => $this->modelo,
            'startDate' => $this->data_inicio?->format('Y-m-d'),
            'endDate' => $this->data_fim?->format('Y-m-d'),
            'quantityType' => $this->quantidade_tipo,
            'quantity' => $this->quantidade,
            'currency' => $this->moeda,
            'totalAmount' => (float) $this->valor_total,
            'rating' => $this->avaliacao,
            'expectedArrivalDate' => $this->data_prevista_chegada?->format('Y-m-d'),
            'expectedArrivalTime' => $this->horario_previsto_chegada,
            'notes' => $this->observacoes,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
            'logs' => $this->whenLoaded('logs', fn () => $this->logs->map(fn ($log) => [
                'id' => $log->id,
                'type' => $log->tipo?->value,
                'description' => $log->descricao,
                'reason' => $log->motivo,
                'workshop' => $log->oficina?->nome_fantasia,
                'technician' => $log->tecnico?->nome_completo,
                'periciaId' => $log->pericia_id,
                'payload' => $log->payload,
                'createdAt' => $log->created_at,
            ])),
        ];
    }

    private function nomeCriadoPor(): ?string
    {
        $usuario = $this->criadoPor;

        if (! $usuario) {
            return null;
        }

        return match ($usuario->perfil) {
            'OFICINA' => $usuario->oficina?->nome_fantasia,
            'TECNICO' => $usuario->tecnico?->nome_completo,
            default => $usuario->nome,
        };
    }
}
