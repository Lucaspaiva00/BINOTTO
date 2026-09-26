<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class ReconhecimentoVeiculoController extends Controller
{
    public function recognize(Request $request)
    {
        $data = $request->validate([
            'campo' => ['required', 'in:placa,chassi,marca,modelo'],
            'imagem' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);
        $key = config('services.openai.key');
        if (! is_string($key) || $key === '') {
            return response()->json(['message' => 'IA não configurada. A fotografia foi anexada; informe o campo manualmente.'], 503);
        }

        $file = $request->file('imagem');
        $mime = $file->getMimeType();
        $image = 'data:'.$mime.';base64,'.base64_encode(file_get_contents($file->getRealPath()));
        $field = $data['campo'];
        try {
            $response = Http::withToken($key)->timeout(35)->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('services.openai.vision_model', 'gpt-4o-mini'),
                'max_tokens' => 90,
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        ['type' => 'text', 'text' => "Extraia da imagem SOMENTE o campo de veículo: {$field}. "
                            .'Responda em texto puro, sem explicações. Se não for identificável, responda NAO_IDENTIFICADO. '
                            .'Não invente informações e não extraia outros dados.'],
                        ['type' => 'image_url', 'image_url' => ['url' => $image, 'detail' => 'high']],
                    ],
                ]],
            ]);
            if (! $response->successful()) {
                return response()->json(['message' => 'O reconhecimento não ficou disponível. A foto foi anexada.'], 502);
            }
            $value = trim((string) $response->json('choices.0.message.content', ''));
            if ($value === '' || str_contains(strtoupper($value), 'NAO_IDENTIFICADO')) {
                return response()->json(['message' => 'Não foi possível identificar com segurança. Confira manualmente.', 'data' => ['valor' => null]]);
            }
            return response()->json(['data' => ['valor' => mb_substr($value, 0, 160)]]);
        } catch (Throwable $e) {
            return response()->json(['message' => 'Falha temporária no reconhecimento. A foto foi mantida no formulário.'], 502);
        }
    }
}
