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
            'nome_completo' => 'required|string|max:255',
            'documento' => 'nullable|string|max:30',
            'email' => ['required', 'email', Rule::unique('usuarios', 'email')->ignore($this->route('id'))],
            'codigo_pais_telefone' => 'required|string|max:5',
            'numero_telefone' => 'required|string|max:15',
            'iso_pais_telefone' => 'nullable|string|max:2',
            'telefone_secundario' => 'nullable|string|max:15',
            'codigo_pais_telefone_secundario' => 'nullable|string|max:5',
            'iso_pais_telefone_secundario' => 'nullable|string|max:2',
            'cidade' => 'required|string|max:255',
            'pais' => 'nullable|string|max:255',
            'status' => 'required|boolean',
            'prazo_pagamento' => 'nullable|string|max:100',
        ];
    }
}
