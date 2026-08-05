<?php

namespace App\Http\Services;

use GuzzleHttp\Client;
use Google\Auth\Credentials\ServiceAccountCredentials;
use Google\Auth\HttpHandler\Guzzle7HttpHandler;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private Client $httpClient;
    private string $projectId = 'binotto-d7c82'; // troca pro seu project id

    public function __construct()
    {
        $this->httpClient = new Client([
            'verify' => false,
        ]);
    }

    private function getAccessToken(): string
    {
        $path = public_path('firebase/firebase-service-account.json');

        $credentials = new ServiceAccountCredentials(
            ['https://www.googleapis.com/auth/firebase.messaging'],
            $path
        );

        $token = $credentials->fetchAuthToken(
            new Guzzle7HttpHandler(new Client())
        );

        return $token['access_token'];
    }

    public function sendToToken(string $token, array $data): bool
    {
        try {
            $accessToken = $this->getAccessToken();

            $payload = [
                'message' => [
                    'token' => $token,

                    'notification' => [
                        'title' => $data['title'] ?? '',
                        'body'  => $data['body'] ?? '',
                    ],

                    'data' => $data['data'] ?? [],
                ]
            ];

            $response = $this->httpClient->post(
                "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send",
                [
                    'headers' => [
                        'Authorization' => "Bearer {$accessToken}",
                        'Content-Type'  => 'application/json',
                    ],
                    'json' => $payload,
                ]
            );

            $success = $response->getStatusCode() === 200;

            Log::info('Push enviado', [
                'token' => $token,
                'success' => $success,
            ]);

            return $success;

        } catch (\Throwable $e) {
            Log::error('Erro ao enviar push', [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}