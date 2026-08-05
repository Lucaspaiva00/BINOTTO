<?php

namespace App\Http\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleService
{
    public function verifyGoogleToken(string $idToken): ?array
    {
        try {
            $response = Http::timeout(10)->get(
                'https://oauth2.googleapis.com/tokeninfo',
                [
                    'id_token' => $idToken,
                ]
            );

            if (!$response->successful()) {
                return null;
            }

            return $response->json();
        } catch (Exception $e) {
            Log::error('Erro ao validar idToken do Google: ' . $e->getMessage());

            return null;
        }
    }

    public function isValidGoogleUser(string $idToken, string $googleId): bool
    {
        $googleUser = $this->verifyGoogleToken($idToken);

        if (!$googleUser) {
            return false;
        }

        return isset($googleUser['sub']) && $googleUser['sub'] === $googleId;
    }
}