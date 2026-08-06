<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuporteMensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticketId' => $this->chamado_id,
            'authorType' => $this->autor_tipo,
            'authorId' => $this->autor_id,
            'body' => $this->corpo,
            'createdAt' => $this->created_at,
        ];
    }
}
