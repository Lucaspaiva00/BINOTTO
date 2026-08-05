<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContaReceberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'origin' => $this->origem,
            'workshopId' => $this->oficina_id,
            'serviceId' => $this->servico_id,
            'description' => $this->descricao,
            'serviceAmount' => (float) $this->valor_servico,
            'platformAmount' => (float) $this->valor_plataforma,
            'paidBy' => $this->quem_pagou,
            'client' => $this->cliente,
            'category' => $this->categoria,
            'paymentMethod' => $this->forma_pagamento,
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
