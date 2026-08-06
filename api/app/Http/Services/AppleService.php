<?php

namespace App\Http\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

class AppleService
{
    public function verifyAppleToken(string $idToken): ?array
    {
        try {
            $response = Http::timeout(10)->get('https://appleid.apple.com/auth/keys');

            if (!$response->successful()) {
                Log::error('Não foi possível buscar as chaves públicas da Apple.');
                return null;
            }

            $applePublicKeys = $response->json();

            $parsedKeys = JWK::parseKeySet($applePublicKeys);

            $decoded = JWT::decode($idToken, $parsedKeys);

            return (array) $decoded;
        } catch (Exception $e) {
            Log::error('Erro ao validar idToken da Apple: ' . $e->getMessage());
            return null;
        }
    }

    public function isValidAppleUser(string $idToken, string $appleId): bool
    {
        $appleUser = $this->verifyAppleToken($idToken);

        if (!$appleUser) {
            return false;
        }
        return isset($appleUser['sub']) && $appleUser['sub'] === $appleId;
    }
}
