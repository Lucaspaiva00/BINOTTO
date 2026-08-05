<?php

namespace App\Http\Controllers\Api\Mobile;

use Illuminate\Http\Request;
use App\Http\Services\PushNotificationService;
use App\Http\Controllers\Controller;

class PushTestController extends Controller
{
    public function send(Request $request, PushNotificationService $service)
    {
        $request->validate([
            'token' => 'required|string',
            'title' => 'nullable|string',
            'body'  => 'nullable|string',
        ]);

        $success = $service->sendToToken(
            $request->token,
            [
                'title' => $request->title ?? 'Teste Push',
                'body'  => $request->body ?? 'Mensagem de teste',
                'data'  => [
                    'test' => "true",
                ],
            ]
        );

        return response()->json([
            'success' => $success
        ]);
    }
}