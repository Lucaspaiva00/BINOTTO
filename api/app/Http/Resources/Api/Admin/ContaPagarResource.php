<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContaPagarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $veiculo = $this->servico?->primeiroVeiculo;
        $refType = $this->referencia_veiculo_tipo ?: ($veiculo?->placa ? 'placa' : ($veiculo?->chassi ? 'chassi' : null));
        return [
            'id' => $this->id,
            'origin' => $this->origem,
            'serviceId' => $this->servico_id,
            'serviceDate' => $this->servico?->data_servico?->format('Y-m-d'),
            'brand' => $veiculo?->marca,
            'vehicleModel' => $veiculo?->modelo,
            'plate' => $veiculo?->placa,
            'chassis' => $veiculo?->chassi,
            'vehicleReferenceType' => $refType,
            'vehicleReference' => $refType === 'chassi' ? $veiculo?->chassi : $veiculo?->placa,
            'technicianId' => $this->tecnico_id,
            'technician' => $this->tecnico?->nome_completo ?? $this->servico?->tecnico_nome_manual,
            'workshopId' => $this->oficina_id,
            'workshop' => $this->oficina?->nome_fantasia,
            'description' => $this->descricao,
            'amountDue' => (float) $this->valor_a_pagar,
            'amountPaid' => (float) $this->valor_pago,
            'commission' => $this->comissao,
            'supplier' => $this->fornecedor,
            'category' => $this->categoria,
            'paymentMethod' => $this->forma_pagamento,
            'invoice' => $this->fatura,
            'invoiceNumber' => $this->numero_fatura,
            'issueDate' => $this->data_emissao?->format('Y-m-d'),
            'launchDate' => $this->data_lancamento?->format('Y-m-d'),
            'paymentDate' => $this->data_pagamento?->format('Y-m-d'),
            'dueDate' => $this->data_vencimento?->format('Y-m-d'),
            'notes' => $this->observacoes,
            'status' => $this->status?->value,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
