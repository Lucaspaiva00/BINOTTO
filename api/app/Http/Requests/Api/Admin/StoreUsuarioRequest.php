<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'perfil' => ['required', Rule::in(['TECNICO', 'OFICINA'])],
            'email' => 'required|email|unique:usuarios,email',
            'codigo_pais_telefone' => 'required|string|max:5',
            'numero_telefone' => 'required|string|max:15',
            'iso_pais_telefone' => 'required|string|max:2',
            'senha' => 'required|string|min:6',
            'confirmar_senha' => 'required|string|min:6|same:senha',
            'nome_completo' => 'required_if:perfil,TECNICO|nullable|string|max:255',
            'apelido' => 'nullable|string|max:100',
            'nome_fantasia' => 'required_if:perfil,OFICINA|nullable|string|max:255',
            'nome_responsavel' => 'required_if:perfil,OFICINA|nullable|string|max:255',
        ];
    }
}
