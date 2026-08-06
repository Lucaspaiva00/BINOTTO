<?php

namespace App\Http\Controllers\Api\Mobile\Tecnico;

use App\Http\Controllers\Controller;
use App\Models\TecnicoDocumento;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TecnicoDocumentoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $tecnico = $user->tecnico;

        if (!$tecnico) {
            return response()->json([
                'message' => __('main.tecnico_not_found')
            ], 404);
        }

        $documentos = TecnicoDocumento::query()
            ->where('tecnico_id', $tecnico->id)
            ->latest()
            ->get();

        return response()->json([
            'documents' => $documentos
        ]);
    }

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $tecnico = $user->tecnico;

            if (!$tecnico) {
                return response()->json([
                    'message' => __('main.tecnico_not_found')
                ], 404);
            }

            $data = $request->validate([
                'documento' => [
                    'required',
                    'file',
                    'max:10240',
                    'mimes:pdf,jpg,jpeg,png'
                ],
                'tipo' => 'required|in:identidade,passaporte,doc_empresa,doc_ext'
            ]);

            $file = $request->file('documento');

            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::uuid() . '.' . $extension;

            $path = $file->storeAs("tecnicos/{$tecnico->id}/documentos", $fileName, 'public');

            $documento = TecnicoDocumento::create([
                'tecnico_id' => $tecnico->id,
                'nome' => $originalName,
                'arquivo' => $path,
                'url' => $path,
                'mime_type' => $file->getMimeType(),
                'tamanho' => $file->getSize(),
                'tipo' => $data['tipo']
            ]);

            return response()->json([
                'message' => __('main.document_uploaded_success'),
                'document' => $documento,
            ], 201);

        } catch (Exception $e) {
            Log::error('Erro ao fazer upload de documento', [
                'user_id' => $request->user()?->id,
                'tecnico_id' => $request->user()?->tecnico?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => __('main.document_upload_error')
            ], 500);
        }
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $tecnico = $user->tecnico;

        $documento = TecnicoDocumento::query()
            ->where('tecnico_id', $tecnico->id)
            ->find($id);

        if (!$documento) {
            return response()->json([
                'message' => __('main.document_not_found')
            ], 404);
        }

        return response()->json([
            'document' => $documento
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        try {
            $user = $request->user();

            $tecnico = $user->tecnico;

            if (!$tecnico) {
                return response()->json([
                    'message' => __('main.tecnico_not_found')
                ], 404);
            }

            $documento = TecnicoDocumento::query()
                ->where('tecnico_id', $tecnico->id)
                ->find($id);

            if (!$documento) {
                return response()->json([
                    'message' => __('main.document_not_found')
                ], 404);
            }

            $documento->delete();

            return response()->json([
                'message' => __('main.document_removed_success')
            ]);

        } catch (Exception $e) {
            Log::error('Erro ao remover documento', [
                'user_id' => $request->user()?->id,
                'tecnico_id' => $request->user()?->tecnico?->id,
                'documento_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => __('main.document_remove_error')
            ], 500);
        }
    }
}