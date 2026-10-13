<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContaPagar;
use App\Models\ContaReceber;
use Illuminate\Http\Request;

class FinanceiroFaturaController extends Controller
{
    private function conta(string $tipo, int $id)
    {
        abort_unless(in_array($tipo, ['contas-receber', 'contas-pagar'], true), 404);

        return ($tipo === 'contas-receber' ? ContaReceber::class : ContaPagar::class)::findOrFail($id);
    }

    public function store(Request $request, string $tipo, int $id)
    {
        $request->validate(['arquivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120']]);
        $c = $this->conta($tipo, $id);
        $f = $request->file('arquivo');
        $c->fatura_conteudo = base64_encode(file_get_contents($f->getRealPath()));
        $c->fatura_mime = $f->getMimeType();
        $c->fatura_nome = $f->getClientOriginalName();
        $c->save();

        return response()->json(['message' => 'Fatura anexada.']);
    }

    public function show(string $tipo, int $id)
    {
        $c = $this->conta($tipo, $id);
        abort_unless($c->fatura_conteudo, 404);

        return response(base64_decode($c->fatura_conteudo), 200, ['Content-Type' => $c->fatura_mime, 'Content-Disposition' => 'inline; filename="fatura-'.$id.'.'.($c->fatura_mime === 'application/pdf' ? 'pdf' : ($c->fatura_mime === 'image/png' ? 'png' : 'jpg')).'"', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }
}
