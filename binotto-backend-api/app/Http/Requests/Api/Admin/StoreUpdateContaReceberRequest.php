<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreUpdateContaReceberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'origem' => 'required|in:aplicativo,avulsa',
            'oficina_id' => 'nullable|integer|exists:oficinas,id',
            'servico_id' => 'nullable|integer|exists:servicos,id',
            'descricao' => 'nullable|string|max:255',
            'valor_servico' => 'required|numeric|min:0',
            'valor_plataforma' => 'required|numeric|min:0',
            'quem_pagou' => 'nullable|string|max:255',
            'cliente' => 'nullable|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'forma_pagamento' => 'nullable|string|max:255',
            'data_emissao' => 'nullable|date',
            'data_recebimento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'data_lancamento' => 'nullable|date',
            'data_vencimento' => 'nullable|date',
            'status' => 'required|in:pendente,confirmado,em_aberto,recebido,vencido,cancelado',
        ];
    }
}
