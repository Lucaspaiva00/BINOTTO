<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Enums\ServicoLogTipoEnum;
use App\Http\Controllers\Controller;
use App\Models\Servico;
use App\Models\ServicoLog;
use App\Support\ServicoPrecos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Preenchimento limitado ao próprio perfil e habilitado pelo administrador. */
final class ServicoPrecoController extends Controller
{
    private function autorizado(Request $request, Servico $servico, string $perfil): bool
    {
        $usuario = $request->user();
        if ($perfil === 'TECNICO') {
            return $usuario?->perfil === 'TECNICO'
                && $usuario->tecnico !== null
                && $servico->tecnico_id !== null
                && (int) $servico->tecnico_id === (int) $usuario->tecnico->id;
        }
        return $usuario?->perfil === 'OFICINA'
            && $usuario->oficina !== null
            && (int) $servico->oficina_id === (int) $usuario->oficina->id;
    }

    private function consultar(Request $request, int $id, string $perfil)
    {
        $servico = Servico::findOrFail($id);
        abort_unless($this->autorizado($request, $servico, $perfil), 404);
        $config = is_array($servico->precos_detalhados) ? $servico->precos_detalhados : [];
        return response()->json([
            'success' => true,
            'data' => [
                'servico_id' => $servico->id,
                'moeda' => $servico->moeda,
                'precos_detalhados' => ServicoPrecos::paraPerfil($config, $perfil),
                'precos_calculados' => ServicoPrecos::calculadosParaPerfil($config, $perfil),
            ],
        ]);
    }

    public function listarTecnico(Request $request, int $id)
    {
        return $this->consultar($request, $id, 'TECNICO');
    }

    public function listarOficina(Request $request, int $id)
    {
        return $this->consultar($request, $id, 'OFICINA');
    }

    public function atualizarTecnico(Request $request, int $id)
    {
        return $this->atualizar($request, $id, 'TECNICO');
    }

    public function atualizarOficina(Request $request, int $id)
    {
        return $this->atualizar($request, $id, 'OFICINA');
    }

    private function atualizar(Request $request, int $id, string $perfil)
    {
        $data = $request->validate([
            'item' => ['required', Rule::in(ServicoPrecos::ITEMS)],
            'tipo' => ['required', Rule::in(['valor', 'porcentagem'])],
            'valor' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ]);
        if ($data['tipo'] === 'porcentagem' && (float) $data['valor'] > 100) {
            throw ValidationException::withMessages(['valor' => ['Percentual máximo de 100%.']]);
        }

        $side = $perfil === 'TECNICO' ? 'tecnico' : 'oficina';
        $key = "{$side}_{$data['item']}";
        DB::transaction(function () use ($request, $id, $perfil, $key, $data) {
            $servico = Servico::whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless($this->autorizado($request, $servico, $perfil), 404);
            $config = ServicoPrecos::normalizar($servico->precos_detalhados ?? []);
            if (! ($config[$key]['habilitado_preenchimento_app'] ?? false)) {
                throw ValidationException::withMessages(['item' => ['Este preço não está habilitado para preenchimento no aplicativo.']]);
            }

            // O APP não tem autorização para editar permissões ou preços do outro perfil.
            $config[$key]['tipo'] = $data['tipo'];
            $config[$key]['valor'] = round((float) $data['valor'], 2);
            try {
                $calculados = ServicoPrecos::calcular($config);
            } catch (\InvalidArgumentException $e) {
                throw ValidationException::withMessages(['valor' => [$e->getMessage()]]);
            }
            $servico->precos_detalhados = $config;
            $servico->valor_total = $calculados['carro']['oficina'];
            $servico->preco_tecnico = $calculados['carro']['tecnico'];
            $servico->percentual_tecnico = ($config['tecnico_carro']['tipo'] ?? null) === 'porcentagem'
                ? $config['tecnico_carro']['valor'] : null;
            $servico->save();
            if ($calculados['carro']['oficina'] !== null && $servico->primeiroVeiculo) {
                $servico->primeiroVeiculo->update(['preco_total' => $calculados['carro']['oficina']]);
            }
            ServicoLog::create([
                'servico_id' => $servico->id,
                'oficina_id' => $perfil === 'OFICINA' ? $servico->oficina_id : null,
                'tecnico_id' => $perfil === 'TECNICO' ? $servico->tecnico_id : null,
                'tipo' => ServicoLogTipoEnum::SERVICO_ATUALIZADO,
                'descricao' => 'Preço atualizado pelo APP ('.$perfil.', '.$data['item'].')',
                // Nunca registrar valores financeiros no log de acesso cruzado.
                'payload' => ['item' => $data['item'], 'perfil' => $perfil],
            ]);
        });
        // Releitura depois do commit: aplica as permissões também à resposta da atualização.
        return $this->consultar($request, $id, $perfil);
    }
}
