<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SuporteController extends Controller
{
    private $email = "admin@jbinotto.com";

    public function sendEmailSupport(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $user = $request->user();

        $name = match ($user->perfil) {
            'TECNICO' => $user->tecnico?->nome_completo,
            'OFICINA' => $user->oficina?->nome_fantasia ?? $user->oficina?->razao_social,
            default => null,
        };

        try {
            Mail::send('emails.support', [
                'subject' => $request->subject,
                'content' => $request->message,
                'user' => $request->user(),
                'name' => $name
            ], function ($message) use ($request) {
                $nomeEmpresa = env('MAIL_NAME', 'Binotto PDR');
                $nomeEmpresa = str_replace('_', ' ', $nomeEmpresa);

                $message->from(env('MAIL_USERNAME'), $nomeEmpresa);
                $message->to($this->email);
                $message->subject('[Suporte] ' . $request->subject);

                if ($request->user()?->email) {
                    $message->replyTo(
                        $request->user()->email,
                        $request->user()->name
                    );
                }
            });

            return response()->json([
                'message' => __('main.support_email_sent_success')
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'message' => __('main.support_email_send_error')
            ], 500);
        }
    }

}
