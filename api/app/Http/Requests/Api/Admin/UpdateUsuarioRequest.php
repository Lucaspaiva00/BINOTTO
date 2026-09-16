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
            'nome_completo' => 'sometimes|nullable|string|max:255',
            'apelido' => 'sometimes|nullable|string|max:100',
            'nome_fantasia' => 'sometimes|nullable|string|max:255',
            'nome_responsavel' => 'sometimes|nullable|string|max:255',
            'razao_social' => 'sometimes|nullable|string|max:255',
            'documento' => 'sometimes|nullable|string|max:30',
            'nome_fantasia_empresa' => 'sometimes|nullable|string|max:255',
            'razao_social_empresa' => 'sometimes|nullable|string|max:255',
            'cnpj_empresa' => 'sometimes|nullable|string|max:30',
            'email' => ['sometimes', 'email', Rule::unique('usuarios', 'email')->ignore($this->route('id'))],
            'email_secundario' => 'sometimes|nullable|email|max:255',
            'codigo_pais_telefone' => 'sometimes|string|max:5',
            'numero_telefone' => 'sometimes|string|max:15',
            'telefone_titular' => 'sometimes|required_with:numero_telefone|string|max:120',
            'iso_pais_telefone' => 'sometimes|nullable|string|max:2',
            'telefone_secundario' => 'sometimes|nullable|string|max:15',
            'telefone_secundario_titular' => 'sometimes|required_with:telefone_secundario|string|max:120',
            'codigo_pais_telefone_secundario' => 'sometimes|nullable|string|max:5',
            'iso_pais_telefone_secundario' => 'sometimes|nullable|string|max:2',
            'rua' => 'sometimes|nullable|string|max:255',
            'numero' => 'sometimes|nullable|string|max:10',
            'complemento' => 'sometimes|nullable|string|max:255',
            'cidade' => 'sometimes|nullable|string|max:255',
            'estado' => 'sometimes|nullable|string|max:100',
            'cep' => 'sometimes|nullable|string|max:20',
            'pais' => 'sometimes|nullable|string|max:255',
            'status' => 'sometimes|boolean',
            'prazo_pagamento' => 'sometimes|nullable|string|max:100',
            'idiomas' => 'sometimes|nullable|array',
            'idiomas.*.idioma' => 'required_with:idiomas|string|max:80',
            'idiomas.*.nivel' => 'required_with:idiomas|in:basico,intermediario,avancado,fluente,nativo',
            'banco_nome' => 'sometimes|nullable|string|max:180',
            'banco_iban' => 'sometimes|nullable|string|max:80',
            'banco_swift' => 'sometimes|nullable|string|max:40',
            'banco_endereco' => 'sometimes|nullable|string|max:255',
        ];
    }
}
