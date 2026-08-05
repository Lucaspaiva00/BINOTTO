<?php

namespace App\Http\Requests\Api\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class RegisterTecnicoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|unique:usuarios,email',
            'codigo_pais_telefone' => 'required|string|max:5',
            'numero_telefone' => 'required|string|max:15',
            'iso_pais_telefone' => 'required|string|max:2',
            'senha' => 'required|string|min:6',
            'confirmar_senha' => 'required|string|min:6|same:senha',
            'nome_completo' => 'required|string|max:255',
            'apelido' => 'nullable|string|max:255',
        ];
    }
}