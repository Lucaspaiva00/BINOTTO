<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OficinaDocumento;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OficinaDocumentoController extends Controller
{
    public function index(int $usuarioId)
    {
        $oficina = $this->resolveOficina($usuarioId);

        if (!$oficina) {
            return response()->json(['message' => __('main.oficina_not_found')], 404);
        }

        $documentos = OficinaDocumento::query()
            ->where('oficina_id', $oficina->id)
            ->where('tipo', 'doc_empresa')
            ->latest()
            ->get();

        return response()->json([
            'documents' => $documentos,
        ]);
    }

    public function store(Request $request, int $usuarioId)
    {
        try {
            $oficina = $this->resolveOficina($usuarioId);

            if (!$oficina) {
                return response()->json(['message' => __('main.oficina_not_found')], 404);
            }

            $data = $request->validate([
                'documento' => [
                    'required',
                    'file',
                    'max:10240',
                    'mimes:pdf,jpg,jpeg,png',
                ],
                'tipo' => 'nullable|in:doc_empresa',
            ]);

            $file = $request->file('documento');
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::uuid() . '.' . $extension;
            $path = $file->storeAs("oficinas/{$oficina->id}/documentos", $fileName, 'public');

            $documento = OficinaDocumento::create([
                'oficina_id' => $oficina->id,
                'nome' => $file->getClientOriginalName(),
                'arquivo' => $path,
                'url' => $path,
                'mime_type' => $file->getMimeType(),
                'tamanho' => $file->getSize(),
                'tipo' => $data['tipo'] ?? 'doc_empresa',
            ]);

            return response()->json([
                'message' => __('main.document_uploaded_success'),
                'document' => $documento,
            ], 201);
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

    public function destroy(int $usuarioId, int $documentoId)
    {
        try {
            $oficina = $this->resolveOficina($usuarioId);

            if (!$oficina) {
                return response()->json(['message' => __('main.oficina_not_found')], 404);
            }

            $documento = OficinaDocumento::query()
                ->where('oficina_id', $oficina->id)
                ->find($documentoId);

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

    private function resolveOficina(int $usuarioId)
    {
        $usuario = User::with('oficina')->find($usuarioId);

        if (!$usuario || $usuario->perfil !== 'OFICINA') {
            return null;
        }

        return $usuario->oficina;
    }
}
