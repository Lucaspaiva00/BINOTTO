<?php

namespace App\Http\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookService
{
    public function verifyFacebookToken(string $accessToken): ?array
    {
        try {
            $response = Http::timeout(10)->post(
                'https://graph.facebook.com/me',
                [
                    'fields' => 'id,name,email',
                    'access_token' => $accessToken,
                ]
            );

            if (!$response->successful()) {
                Log::error('Facebook API retornou erro: ' . $response->body());
                return null;
            }

            return $response->json();
        } catch (Exception $e) {
            Log::error('Erro ao validar accessToken do Facebook: ' . $e->getMessage());

            return null;
        }
    }

    public function isValidFacebookUser(string $idToken, string $facebookId): bool
    {
        $facebookUser = $this->verifyFacebookToken($idToken);

        if (!$facebookUser) {
            return false;
        }

        return isset($facebookUser['id']) && $facebookUser['id'] === $facebookId;
    }
}
