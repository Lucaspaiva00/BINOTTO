<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreUpdateContaPagarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'origem' => 'required|in:aplicativo,avulsa',
            'servico_id' => 'nullable|integer|exists:servicos,id',
            'tecnico_id' => 'nullable|integer|exists:tecnicos,id',
            'oficina_id' => 'nullable|integer|exists:oficinas,id',
            'descricao' => 'nullable|string|max:255',
            'valor_a_pagar' => 'required|numeric|min:0',
            'valor_pago' => 'required|numeric|min:0',
            'fornecedor' => 'nullable|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'forma_pagamento' => 'nullable|string|max:255',
            'data_emissao' => 'nullable|date',
            'data_pagamento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'data_lancamento' => 'nullable|date',
            'data_vencimento' => 'nullable|date',
            'status' => 'required|in:pendente,confirmado,em_aberto,pago,vencido,cancelado',
        ];
    }
}
