<?php

namespace App\Http\Services;

use App\Models\SuporteChamado;
use App\Models\SuporteMensagem;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SuporteChamadoService
{
    private string $supportEmail = 'admin@jbinotto.com';

    public function create(User $usuario, User $admin, string $assunto, string $mensagem): SuporteChamado
    {
        return DB::transaction(function () use ($usuario, $admin, $assunto, $mensagem) {
            $chamado = SuporteChamado::create([
                'usuario_id' => $usuario->id,
                'assunto' => $assunto,
                'status' => 'aberto',
            ]);

            $mensagemModel = $chamado->mensagens()->create([
                'autor_tipo' => 'admin',
                'autor_id' => $admin->id,
                'corpo' => $mensagem,
            ]);

            $this->sendMailCopy($usuario, $assunto, $mensagemModel->corpo, $chamado->id);

            return $chamado->load('mensagens');
        });
    }

    public function reply(SuporteChamado $chamado, User $admin, string $mensagem): SuporteMensagem
    {
        $mensagemModel = $chamado->mensagens()->create([
            'autor_tipo' => 'admin',
            'autor_id' => $admin->id,
            'corpo' => $mensagem,
        ]);

        if ($chamado->status === 'fechado') {
            $chamado->update(['status' => 'aberto']);
        }

        $usuario = $chamado->usuario;
        $this->sendMailCopy(
            $usuario,
            'Re: ' . $chamado->assunto,
            $mensagemModel->corpo,
            $chamado->id,
        );

        return $mensagemModel;
    }

    public function close(SuporteChamado $chamado): SuporteChamado
    {
        $chamado->update(['status' => 'fechado']);

        return $chamado->fresh('mensagens');
    }

    private function sendMailCopy(User $usuario, string $subject, string $content, int $chamadoId): void
    {
        $name = match ($usuario->perfil) {
            'TECNICO' => $usuario->tecnico?->nome_completo,
            'OFICINA' => $usuario->oficina?->nome_fantasia ?? $usuario->oficina?->razao_social,
            default => $usuario->nome,
        };

        try {
            Mail::send('emails.support', [
                'subject' => $subject . " [#{$chamadoId}]",
                'content' => $content,
                'user' => $usuario,
                'name' => $name,
            ], function ($message) use ($subject, $usuario, $chamadoId) {
                $nomeEmpresa = str_replace('_', ' ', env('MAIL_NAME', 'Binotto PDR'));

                $message->from(env('MAIL_USERNAME'), $nomeEmpresa);
                $message->to($this->supportEmail);
                $message->subject('[Suporte] ' . $subject . " [#{$chamadoId}]");

                if ($usuario->email) {
                    $message->cc($usuario->email);
                    $message->replyTo($usuario->email, $usuario->email);
                }
            });
        } catch (Exception $e) {
            Log::error('Erro ao enviar e-mail de suporte do chamado', [
                'chamado_id' => $chamadoId,
                'usuario_id' => $usuario->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
