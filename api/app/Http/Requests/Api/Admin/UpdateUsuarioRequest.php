<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome_completo' => 'nullable|string|max:255',
            'nome_fantasia' => 'nullable|string|max:255',
            'nome_responsavel' => 'nullable|string|max:255',
            'razao_social' => 'nullable|string|max:255',
            'documento' => 'nullable|string|max:30',
            'email' => ['required', 'email', Rule::unique('usuarios', 'email')->ignore($this->route('id'))],
            'email_secundario' => 'nullable|email|max:255',
            'codigo_pais_telefone' => 'required|string|max:5',
            'numero_telefone' => 'required|string|max:15',
            'iso_pais_telefone' => 'nullable|string|max:2',
            'telefone_secundario' => 'nullable|string|max:15',
            'codigo_pais_telefone_secundario' => 'nullable|string|max:5',
            'iso_pais_telefone_secundario' => 'nullable|string|max:2',
            'rua' => 'nullable|string|max:255',
            'numero' => 'nullable|string|max:10',
            'complemento' => 'nullable|string|max:255',
            'cidade' => 'required|string|max:255',
            'estado' => 'nullable|string|max:100',
            'cep' => 'nullable|string|max:20',
            'pais' => 'nullable|string|max:255',
            'status' => 'required|boolean',
            'prazo_pagamento' => 'nullable|string|max:100',
        ];
    }
}
