<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ServicoLogTipoEnum;
use App\Enums\ServicoStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Admin\ServicoResource;
use App\Models\Servico;
use App\Models\ServicoLog;
use App\Support\ServicoPrecos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Dados da nova tela de serviço, preservando estrutura anterior e as fotos do APP.
 * Fotos novas entram via multipart; fotos já persistidas só podem ser reaproveitadas
 * quando pertencem ao próprio veículo do serviço.
 */
class ServicoDetalhesController extends Controller
{
    private const PARTES = [
        'capo', 'paralama_dianteiro_esq', 'porta_dianteira_esq', 'porta_traseira_esq',
        'lateral_esq', 'coluna_esq', 'tampa_inferior', 'tampa_superior', 'lateral_dir',
        'porta_traseira_dir', 'porta_dianteira_dir', 'paralama_dianteiro_dir', 'coluna_dir', 'teto',
    ];
    private const FOTOS_VEICULO = ['frente_motorista', 'traseira_carona', 'placa', 'chassi', 'marca', 'modelo'];
    private const PRECO_KEYS = ['oficina_desmontagem', 'oficina_carro', 'tecnico_desmontagem', 'tecnico_carro'];

    public function salvar(Request $request, int $id)
    {
        $servico = Servico::with('primeiroVeiculo')->findOrFail($id);
        // Campos complexos são enviados como JSON dentro do multipart.
        $reparos = json_decode((string) $request->input('reparos_execucao', 'null'), true);
        $precos = json_decode((string) $request->input('precos_detalhados', 'null'), true);
        $fotosExistentes = json_decode((string) $request->input('fotos_veiculo_existentes', 'null'), true);
        if (! is_array($reparos) || ! is_array($precos) || ! is_array($fotosExistentes)) {
            throw ValidationException::withMessages(['reparos_execucao' => ['Envie reparos, preços e fotos existentes como JSON válido.']]);
        }
        $request->merge(['reparos' => $reparos, 'precos' => $precos]);
        $request->validate([
            'placa' => ['nullable', 'string', 'max:20'],
            'chassi' => ['nullable', 'string', 'max:30'],
            'marca' => ['nullable', 'string', 'max:100'],
            'modelo' => ['nullable', 'string', 'max:150'],
            'observacoes' => ['nullable', 'string', 'max:2000'],
            'tipo_pericia' => ['required', Rule::in(['simples', 'completa'])],
            'reparos' => ['required', 'array', 'max:14'],
            'reparos.*.peca' => ['required', Rule::in(self::PARTES)],
            'reparos.*.tipoReparo' => ['required', Rule::in(['PDR', 'PINTURA', 'TROCA', 'ALUMINIO_PDR', 'ALUMINIO_PINTURA', 'SEM_DANO'])],
            'reparos.*.amassadosAte2' => ['required', 'integer', 'min:0', 'max:9999'],
            'reparos.*.amassadosAte5' => ['required', 'integer', 'min:0', 'max:9999'],
            'reparos.*.amassadosAcima5' => ['required', 'integer', 'min:0', 'max:9999'],
            'reparos.*.observacoes' => ['nullable', 'string', 'max:255'],
            'precos' => ['required', 'array', 'size:4'],
            'precos.*.tipo' => ['required', Rule::in(['valor', 'porcentagem'])],
            'precos.*.valor' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'precos.*.visivel_app' => ['required', 'boolean'],
            'precos.*.habilitado_preenchimento_app' => ['sometimes', 'boolean'],
            'fotos_veiculo' => ['sometimes', 'array'],
            'fotos_veiculo.*' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'fotos_reparos' => ['sometimes', 'array'],
            'fotos_reparos.*' => ['array', 'max:3'],
            'fotos_reparos.*.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ]);

        $ids = array_column($reparos, 'peca');
        if (count($ids) !== count(array_unique($ids))) {
            throw ValidationException::withMessages(['reparos_execucao' => ['Não repita uma mesma peça.']]);
        }
        if (array_diff(array_keys($precos), self::PRECO_KEYS) || array_diff(self::PRECO_KEYS, array_keys($precos))) {
            throw ValidationException::withMessages(['precos_detalhados' => ['Os quatro preços devem estar presentes.']]);
        }
        foreach ($precos as $key => $price) {
            if (($price['tipo'] ?? '') === 'porcentagem' && (float) ($price['valor'] ?? 0) > 100) {
                throw ValidationException::withMessages(['precos_detalhados' => ["A porcentagem de {$key} deve ser de 0 a 100%."]]);
            }
        }
        $precos = ServicoPrecos::normalizar($precos);
        try {
            $valoresCalculados = ServicoPrecos::calcular($precos);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['precos_detalhados' => [$e->getMessage()]]);
        }
        if (array_diff(array_keys($fotosExistentes), self::FOTOS_VEICULO)) {
            throw ValidationException::withMessages(['fotos_veiculo_existentes' => ['Tipo de fotografia desconhecido.']]);
        }
        foreach (array_keys($request->file('fotos_veiculo', [])) as $key) {
            if (! in_array($key, self::FOTOS_VEICULO, true)) {
                throw ValidationException::withMessages(['fotos_veiculo' => ['Tipo de fotografia desconhecido.']]);
            }
        }
        foreach (array_keys($request->file('fotos_reparos', [])) as $key) {
            if (! in_array($key, self::PARTES, true)) {
                throw ValidationException::withMessages(['fotos_reparos' => ['Peça desconhecida.']]);
            }
        }
        $pathsCriados = [];
        $pathsRemovidos = [];
        try {
            DB::transaction(function () use ($request, $servico, $reparos, $precos, $fotosExistentes, $valoresCalculados, &$pathsCriados, &$pathsRemovidos) {
                $veiculo = $servico->primeiroVeiculo ?: $servico->veiculos()->create(['preco_total' => 0, 'reparos_execucao' => []]);
                $anteriores = $veiculo->fotos_veiculo ?? [];
                $fotos = [];
                foreach (self::FOTOS_VEICULO as $key) {
                    $path = $fotosExistentes[$key] ?? null;
                    $known = $anteriores[$key] ?? null;
                    if ($path !== null && $path !== $known && $path !== Storage::disk('public')->url((string) $known)) {
                        throw ValidationException::withMessages(['fotos_veiculo_existentes' => ['A foto informada não pertence ao serviço.']]);
                    }
                    if ($path && $known) $fotos[$key] = $known;
                    if ($request->hasFile("fotos_veiculo.{$key}")) {
                        if ($known) $pathsRemovidos[] = $known;
                        $fotos[$key] = $request->file("fotos_veiculo.{$key}")->store("servicos/{$servico->id}/veiculo", 'public');
                        $pathsCriados[] = $fotos[$key];
                    } elseif ($known && ! isset($fotos[$key])) {
                        $pathsRemovidos[] = $known;
                    }
                }
                $existing = collect($veiculo->reparos_execucao ?? [])->keyBy('peca');
                $saved = [];
                foreach ($reparos as $repair) {
                    $key = $repair['peca'];
                    $old = $existing->get($key, []);
                    $known = $old['fotos'] ?? [];
                    $keep = [];
                    foreach ($repair['fotos'] ?? [] as $path) {
                        $matching = collect($known)->first(fn ($oldPath) => $oldPath === $path || Storage::disk('public')->url($oldPath) === $path);
                        if (! $matching) throw ValidationException::withMessages(['reparos_execucao' => ['Fotografia não pertence a esta peça.']]);
                        $keep[] = $matching;
                    }
                    $newFiles = $request->file("fotos_reparos.{$key}", []);
                    if (count($keep) + count($newFiles) > 3) {
                        throw ValidationException::withMessages(['fotos_reparos' => ['Limite: três fotos por peça.']]);
                    }
                    foreach ($newFiles as $file) {
                        $newPath = $file->store("servicos/{$servico->id}/pecas/{$key}", 'public');
                        $pathsCriados[] = $newPath;
                        $keep[] = $newPath;
                    }
                    $pathsRemovidos = array_merge($pathsRemovidos, array_diff($known, $keep));
                    $saved[] = array_merge($old, [
                        'peca' => $key,
                        'tipoReparo' => $repair['tipoReparo'],
                        'amassadosAte2' => (int) $repair['amassadosAte2'],
                        'amassadosAte5' => (int) $repair['amassadosAte5'],
                        'amassadosAcima5' => (int) $repair['amassadosAcima5'],
                        'observacoes' => (string) ($repair['observacoes'] ?? ''),
                        'fotos' => $keep,
                    ]);
                }
                // Não apaga peças legadas que não foram enviadas pelo novo formulário.
                $submitted = collect($saved)->pluck('peca')->all();
                foreach ($existing as $part => $old) {
                    if (! in_array($part, $submitted, true)) $saved[] = $old;
                }
                $brand = trim((string) $request->input('marca', ''));
                $model = trim((string) $request->input('modelo', ''));
                $veiculo->update([
                    'placa' => trim(strtoupper((string) $request->input('placa', ''))),
                    'chassi' => trim(strtoupper((string) $request->input('chassi', ''))),
                    'marca' => $brand !== '' ? $brand : null,
                    'modelo' => $model !== '' ? $model : null,
                    'marca_modelo' => trim($brand.' '.$model) ?: null,
                    'fotos_veiculo' => $fotos,
                    'reparos_execucao' => $saved,
                ]);
                if ($valoresCalculados['carro']['oficina'] !== null) {
                    $veiculo->update(['preco_total' => $valoresCalculados['carro']['oficina']]);
                }
                $servico->update([
                    'pericia_completa' => $request->input('tipo_pericia') === 'completa',
                    'observacoes' => $request->input('observacoes'),
                    'precos_detalhados' => $precos,
                    // Espelha os valores calculados nas colunas legadas, sem confundir a base
                    // da oficina com o percentual do técnico. A desmontagem segue separada.
                    'valor_total' => $valoresCalculados['carro']['oficina'],
                    'preco_tecnico' => $valoresCalculados['carro']['tecnico'],
                    'percentual_tecnico' => $precos['tecnico_carro']['tipo'] === 'porcentagem'
                        ? $precos['tecnico_carro']['valor'] : null,
                ]);
                ServicoLog::create([
                    'servico_id' => $servico->id,
                    'oficina_id' => $servico->oficina_id,
                    'tecnico_id' => $servico->tecnico_id,
                    'tipo' => ServicoLogTipoEnum::SERVICO_ATUALIZADO,
                    'descricao' => 'Administrador atualizou os detalhes de carro, reparos e preços',
                ]);
            });
            if ($pathsRemovidos) Storage::disk('public')->delete(array_unique($pathsRemovidos));
        } catch (Throwable $e) {
            if ($pathsCriados) Storage::disk('public')->delete($pathsCriados);
            throw $e;
        }
        return response()->json(['data' => new ServicoResource($servico->fresh()->load([
            'oficina', 'tecnico', 'primeiroVeiculo', 'pericias', 'criadoPor.oficina', 'criadoPor.tecnico',
        ]))]);
    }

    public function aceitar(Request $request, int $id)
    {
        $data = $request->validate([
            'tecnico_id' => ['required', 'integer', 'exists:tecnicos,id'],
        ]);
        $servico = DB::transaction(function () use ($id, $data) {
            $s = Servico::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! in_array($s->status, [ServicoStatusEnum::AGUARDANDO, ServicoStatusEnum::EM_BREVE, ServicoStatusEnum::AGUARDANDO_APROVACAO], true)) {
                throw ValidationException::withMessages(['status' => ['Este serviço não está aguardando aceite.']]);
            }
            if ($s->tecnico_id !== null && $s->tecnico_id !== $data['tecnico_id']) {
                throw ValidationException::withMessages(['tecnico_id' => ['Outro técnico está designado.']]);
            }
            $s->update(['tecnico_id' => $data['tecnico_id'], 'status' => ServicoStatusEnum::ACEITO, 'aceito_em' => now(), 'disponivel_para_todos' => false]);
            ServicoLog::create(['servico_id' => $s->id, 'tecnico_id' => $s->tecnico_id, 'tipo' => ServicoLogTipoEnum::SERVICO_ACEITO, 'descricao' => 'Administrador confirmou a aceitação do técnico']);
            return $s;
        });
        return response()->json(['data' => new ServicoResource($servico->fresh()->load(['oficina', 'tecnico', 'primeiroVeiculo', 'pericias']))]);
    }

    public function recusar(Request $request, int $id)
    {
        $servico = DB::transaction(function () use ($id) {
            $s = Servico::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! in_array($s->status, [ServicoStatusEnum::ACEITO, ServicoStatusEnum::AGUARDANDO_APROVACAO, ServicoStatusEnum::EM_BREVE], true)) {
                throw ValidationException::withMessages(['status' => ['Não é permitido recusar um serviço em execução ou finalizado.']]);
            }
            $oldTech = $s->tecnico_id;
            $s->update(['tecnico_id' => null, 'status' => ServicoStatusEnum::AGUARDANDO, 'aceito_em' => null, 'disponivel_para_todos' => true, 'liberado_para_todos_em' => now()]);
            ServicoLog::create(['servico_id' => $s->id, 'tecnico_id' => $oldTech, 'tipo' => ServicoLogTipoEnum::SERVICO_ATUALIZADO, 'descricao' => 'Administrador recusou/liberou a atribuição do técnico']);
            return $s;
        });
        return response()->json(['data' => new ServicoResource($servico->fresh()->load(['oficina', 'tecnico', 'primeiroVeiculo', 'pericias']))]);
    }
}
