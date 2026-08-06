<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->senha === '') {
            $this->merge(['senha' => null, 'confirmar_senha' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'nome' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('usuarios', 'email')->ignore($this->route('id'))],
            'senha' => 'nullable|string|min:6',
            'confirmar_senha' => 'nullable|required_with:senha|string|same:senha',
            'status' => 'required|boolean',
        ];
    }
}
