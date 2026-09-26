<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\ServicoStatusEnum;
use Illuminate\Validation\Rule;

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
            'modo_completo' => ['sometimes','boolean'],
            'tecnico_id' => ['nullable','integer','exists:tecnicos,id'],
            'status' => ['nullable','string',Rule::in(array_column(ServicoStatusEnum::cases(), 'value'))],
            'placa' => ['nullable','string','max:20'],
            'chassi' => ['nullable','string','max:30'],
            'marca_modelo' => ['nullable','string','max:255'],
            'valor_total' => ['nullable','numeric','min:0'],
            'remuneracao_tipo' => ['nullable',Rule::in(['valor','porcentagem'])],
            'remuneracao_tecnico' => ['nullable','numeric','min:0'],
            'reparos_execucao' => ['nullable','array','max:100'],
            'reparos_execucao.*.peca' => ['required_with:reparos_execucao','string','max:100'],
            'reparos_execucao.*.tipoReparo' => ['nullable','string','max:60'],
            'reparos_execucao.*.quantidadeAmassados' => ['nullable','integer','min:0'],
            'reparos_execucao.*.quantidadeImpactosMaior25' => ['nullable','integer','min:0'],
            'reparos_execucao.*.quantidadeImpactosMenor25' => ['nullable','integer','min:0'],
            'reparos_execucao.*.observacoes' => ['nullable','string','max:2000'],
        ];
    }
}
