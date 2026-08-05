<?php

namespace App\Http\Requests\Api\Mobile;

use Illuminate\Foundation\Http\FormRequest;

class RegisterSocialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => 'required|in:google,apple,facebook',
            'perfil' => 'required|in:TECNICO,OFICINA',
            'id' => 'required|string',
            'idToken' => 'required_if:tipo,google|string',
            'nome' => 'nullable|string',
            'email' => 'nullable|string',
        ];
    }
}