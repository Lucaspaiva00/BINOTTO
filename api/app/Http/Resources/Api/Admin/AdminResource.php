<?php

namespace App\Http\Resources\Api\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nome,
            'email' => $this->email,
            'createdAt' => $this->created_at,
            'status' => $this->ativo ? 'ativo' : 'desativado',
        ];
    }
}
