<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuporteChamadoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->usuario_id,
            'subject' => $this->assunto,
            'status' => $this->status,
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
            'messages' => SuporteMensagemResource::collection($this->whenLoaded('mensagens')),
        ];
    }
}
