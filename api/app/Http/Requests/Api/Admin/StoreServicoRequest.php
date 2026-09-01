<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreServicoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'oficina_id' => 'required|integer|exists:oficinas,id',
            'moeda' => 'nullable|string|size:3',
            'data_inicio' => 'nullable|date',
            'data_fim' => 'nullable|date|after_or_equal:data_inicio',
            'quantidade_tipo' => 'nullable|in:carros,dias',
            'quantidade' => 'nullable|integer|min:1',
            'observacoes' => 'nullable|string|max:2000',
        ];
    }
}
