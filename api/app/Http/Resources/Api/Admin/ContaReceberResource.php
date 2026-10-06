<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContaReceberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $veiculo = $this->servico?->primeiroVeiculo;
        $refType = $this->referencia_veiculo_tipo ?: ($veiculo?->placa ? 'placa' : ($veiculo?->chassi ? 'chassi' : null));
        return [
            'id' => $this->id,
            'origin' => $this->origem,
            'workshopId' => $this->oficina_id,
            'workshop' => $this->oficina?->nome_fantasia,
            'technicianId' => $this->tecnico_id,
            'technician' => $this->tecnico?->nome_completo ?? $this->servico?->tecnico_nome_manual,
            'serviceId' => $this->servico_id,
            'serviceDate' => $this->servico?->data_servico?->format('Y-m-d'),
            'brand' => $veiculo?->marca,
            'vehicleModel' => $veiculo?->modelo,
            'plate' => $veiculo?->placa,
            'chassis' => $veiculo?->chassi,
            'vehicleReferenceType' => $refType,
            'vehicleReference' => $refType === 'chassi' ? $veiculo?->chassi : $veiculo?->placa,
            'description' => $this->descricao,
            'serviceAmount' => (float) $this->valor_servico,
            'platformAmount' => (float) $this->valor_plataforma,
            'paidBy' => $this->quem_pagou,
            'client' => $this->cliente,
            'category' => $this->categoria,
            'paymentMethod' => $this->forma_pagamento,
            'invoice' => $this->fatura,
            'invoiceNumber' => $this->numero_fatura,
            'invoiceStatus' => $this->status_fatura,
            'receivedDate' => $this->data_recebimento?->format('Y-m-d'),
            'notes' => $this->observacoes,
            'issueDate' => $this->data_emissao?->format('Y-m-d'),
            'launchDate' => $this->data_lancamento?->format('Y-m-d'),
            'dueDate' => $this->data_vencimento?->format('Y-m-d'),
            'status' => $this->status?->value,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
