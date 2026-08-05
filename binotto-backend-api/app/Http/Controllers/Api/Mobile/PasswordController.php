<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class PasswordController extends Controller
{
    public function sendRecoveryCode(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
        ]);

        $login = $request->input('login');
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'whatsapp';

        $user = User::where($field, $login)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Usuário não encontrado.'
            ], 404);
        }

        do {
            $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (User::where('cod_recuperacao', $codigo)->exists());

        $user->update([
            'cod_recuperacao' => $codigo,
            'cod_expira_em' => now()->addMinutes(10),
            'cod_canal' => $field === 'email' ? 'email' : 'whatsapp',
        ]);

        if ($field === 'email') {
            try {
                Mail::send('emails.recovery_code', [
                    'user' => $user,
                    'codigo' => $codigo
                ], function ($message) use ($user) {
                    $nomeEmpresa = env('MAIL_NAME', 'Binotto PDR');
                    $nomeEmpresa = str_replace('_', ' ', $nomeEmpresa);
                    $message->from(env('MAIL_USERNAME'), $nomeEmpresa);
                    $message->to($user->email);
                    $message->subject('Recuperação de senha - Binotto PDR');
                });
            } catch (Exception $e) {
                return response()->json([
                    'message' => 'Código gerado, mas falha no envio do e-mail. Tente novamente.'
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Código de recuperação enviado.'
        ], 200);
    }

    public function confirmRecoveryCode(Request $request)
    {
        $request->validate([
            'codigo' => 'required|string|size:6',
        ]);

        $user = User::where('cod_recuperacao', $request->codigo)->first();

        if (!$user) {
            return response()->json(['message' => 'Código inválido.'], 400);
        }

        if (now()->greaterThan($user->cod_expira_em)) {
            return response()->json(['message' => 'Código expirado.'], 400);
        }

        $user->update([
            'cod_usado_em' => now()
        ]);

        return response()->json([
            'message' => 'Código validado com sucesso.',
            'usuario_id' => $user->id
        ], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'usuario_id' => 'required|integer',
            'senha' => 'required|string|min:6',
            'senha_confirmacao' => 'required|string|min:6',
        ]);

        if ($request->senha !== $request->senha_confirmacao) {
            return response()->json(['message' => 'Senhas não conferem.'], 400);
        }

        $user = User::find($request->usuario_id);

        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        if (!$user->cod_usado_em) {
            return response()->json(['message' => 'Código não validado.'], 403);
        }

        $user->update([
            'senha' => Hash::make($request->senha),
            'cod_recuperacao' => null,
            'cod_expira_em' => null,
            'cod_usado_em' => null,
            'cod_canal' => null,
        ]);

        return response()->json([
            'message' => 'Senha redefinida com sucesso.'
        ], 200);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'senha_atual' => 'required|string',
            'nova_senha' => 'required|string|min:8',
            'nova_senha_confirmacao' => 'required|string|same:nova_senha',
        ]);

        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Usuário não autenticado.'
            ], 401);
        }

        // valida senha atual
        if (!Hash::check($request->senha_atual, $user->senha)) {
            return response()->json([
                'message' => 'Senha atual incorreta.'
            ], 400);
        }

        // impede mesma senha
        if (Hash::check($request->nova_senha, $user->senha)) {
            return response()->json([
                'message' => 'A nova senha deve ser diferente da atual.'
            ], 400);
        }

        $user->update([
            'senha' => Hash::make($request->nova_senha)
        ]);

        return response()->json([
            'message' => 'Senha alterada com sucesso.'
        ], 200);
    }
}
