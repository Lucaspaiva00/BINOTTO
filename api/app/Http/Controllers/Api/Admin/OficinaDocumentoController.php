<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OficinaDocumento;
use App\Models\TecnicoDocumento;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class OficinaDocumentoController extends Controller
{
    public function index(Request $request, int $usuarioId)
    {
        if ($request->has('download')) {
            $documentoId = filter_var($request->query('download'), FILTER_VALIDATE_INT);
            if ($documentoId === false || $documentoId < 1) {
                return response()->json(['message' => 'Documento inválido.'], 422);
            }
            return $this->download($usuarioId, $documentoId);
        }

        $usuario = $this->resolveUsuario($usuarioId);

        if (!$usuario) {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        if ($usuario->perfil === 'OFICINA') {
            if (!$usuario->oficina) {
                return response()->json(['message' => __('main.oficina_not_found')], 404);
            }

            $documentos = OficinaDocumento::query()
                ->where('oficina_id', $usuario->oficina->id)
                ->where('tipo', 'doc_empresa')
                ->latest()
                ->get();
        } elseif ($usuario->perfil === 'TECNICO') {
            if (!$usuario->tecnico) {
                return response()->json(['message' => __('main.tecnico_not_found')], 404);
            }

            $documentos = TecnicoDocumento::query()
                ->where('tecnico_id', $usuario->tecnico->id)
                ->latest()
                ->get();
        } else {
            return response()->json(['message' => __('auth.user_not_found')], 404);
        }

        return response()->json([
            'documents' => $documentos,
        ]);
    }

    public function store(Request $request, int $usuarioId)
    {
        try {
            $usuario = $this->resolveUsuario($usuarioId);

            if (!$usuario) {
                return response()->json(['message' => __('auth.user_not_found')], 404);
            }

            if ($usuario->perfil === 'OFICINA') {
                if (!$usuario->oficina) {
                    return response()->json(['message' => __('main.oficina_not_found')], 404);
                }

                $data = $request->validate([
                    'documento' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
                    'tipo' => 'nullable|in:doc_empresa',
                ]);

                $file = $request->file('documento');
                $path = $file->storeAs(
                    "oficinas/{$usuario->oficina->id}/documentos",
                    Str::uuid() . '.' . $file->getClientOriginalExtension(),
                    'public',
                );

                if ($path === false) {
                    throw new Exception('Não foi possível salvar o arquivo.');
                }

                $documento = OficinaDocumento::create([
                    'oficina_id' => $usuario->oficina->id,
                    'nome' => $file->getClientOriginalName(),
                    'arquivo' => $path,
                    'url' => $path,
                    'mime_type' => $file->getMimeType(),
                    'tamanho' => $file->getSize(),
                    'tipo' => $data['tipo'] ?? 'doc_empresa',
                ]);
            } elseif ($usuario->perfil === 'TECNICO') {
                if (!$usuario->tecnico) {
                    return response()->json(['message' => __('main.tecnico_not_found')], 404);
                }

                $data = $request->validate([
                    'documento' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,pfx,p12'],
                    'tipo' => 'required|in:identidade,passaporte,doc_empresa,doc_ext,certificado_a1',
                ]);

                $file = $request->file('documento');
                $path = $file->storeAs(
                    "tecnicos/{$usuario->tecnico->id}/documentos",
                    Str::uuid() . '.' . $file->getClientOriginalExtension(),
                    'public',
                );

                if ($path === false) {
                    throw new Exception('Não foi possível salvar o arquivo.');
                }

                $documento = TecnicoDocumento::create([
                    'tecnico_id' => $usuario->tecnico->id,
                    'nome' => $file->getClientOriginalName(),
                    'arquivo' => $path,
                    'url' => $path,
                    'mime_type' => $file->getMimeType(),
                    'tamanho' => $file->getSize(),
                    'tipo' => $data['tipo'],
                ]);
            } else {
                return response()->json(['message' => __('auth.user_not_found')], 404);
            }

            return response()->json([
                'message' => __('main.document_uploaded_success'),
                'document' => $documento,
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (Exception $e) {
            Log::error('Erro ao fazer upload de documento (admin)', [
                'usuario_id' => $usuarioId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('main.document_upload_error'),
            ], 500);
        }
    }

    public function download(int $usuarioId, int $documentoId)
    {
        $usuario = $this->resolveUsuario($usuarioId);
        if (! $usuario) {
            return response()->json(['message' => 'Usuário não encontrado.'], 404);
        }

        if ($usuario->perfil === 'TECNICO' && $usuario->tecnico) {
            $documento = TecnicoDocumento::where('tecnico_id', $usuario->tecnico->id)->find($documentoId);
        } elseif ($usuario->perfil === 'OFICINA' && $usuario->oficina) {
            $documento = OficinaDocumento::where('oficina_id', $usuario->oficina->id)->find($documentoId);
        } else {
            return response()->json(['message' => 'Documento não encontrado.'], 404);
        }

        if (! $documento || ! $documento->arquivo || ! Storage::disk('public')->exists($documento->arquivo)) {
            return response()->json(['message' => 'Arquivo não encontrado no armazenamento.'], 404);
        }

        return Storage::disk('public')->download($documento->arquivo, $documento->nome);
    }

    public function destroy(int $usuarioId, int $documentoId)
    {
        try {
            $usuario = $this->resolveUsuario($usuarioId);

            if (!$usuario) {
                return response()->json(['message' => __('auth.user_not_found')], 404);
            }

            if ($usuario->perfil === 'OFICINA') {
                if (!$usuario->oficina) {
                    return response()->json(['message' => __('main.oficina_not_found')], 404);
                }

                $documento = OficinaDocumento::query()
                    ->where('oficina_id', $usuario->oficina->id)
                    ->find($documentoId);
            } elseif ($usuario->perfil === 'TECNICO') {
                if (!$usuario->tecnico) {
                    return response()->json(['message' => __('main.tecnico_not_found')], 404);
                }

                $documento = TecnicoDocumento::query()
                    ->where('tecnico_id', $usuario->tecnico->id)
                    ->find($documentoId);
            } else {
                return response()->json(['message' => __('auth.user_not_found')], 404);
            }

            if (!$documento) {
                return response()->json(['message' => __('main.document_not_found')], 404);
            }

            $documento->delete();

            return response()->json([
                'message' => __('main.document_removed_success'),
            ]);
        } catch (Exception $e) {
            Log::error('Erro ao remover documento (admin)', [
                'usuario_id' => $usuarioId,
                'documento_id' => $documentoId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('main.document_remove_error'),
            ], 500);
        }
    }

    private function resolveUsuario(int $usuarioId): ?User
    {
        return User::with(['oficina', 'tecnico'])->find($usuarioId);
    }
}
