<?php

namespace Tests\Feature;

use App\Enums\ServicoStatusEnum;
use App\Models\Servico;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** Isolated SQLite fixture for the admin service workflow, without production data. */
class AdminServiceImprovementsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(["jwt.secret" => str_repeat("local-test-key", 4)]);
        $this->withoutMiddleware([\Illuminate\Auth\Middleware\Authenticate::class, \App\Http\Middleware\Api\CheckPermission::class]);
        Schema::create('oficinas', function (Blueprint $t) {
            $t->id(); $t->string('nome_fantasia'); $t->string('cidade')->nullable(); $t->string('pais')->nullable();
        });
        Schema::create('tecnicos', function (Blueprint $t) { $t->id(); $t->string('nome_completo'); });
        Schema::create('usuarios', function (Blueprint $t) { $t->id(); $t->softDeletes(); });
        Schema::create('servicos', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('oficina_id')->nullable(); $t->unsignedBigInteger('tecnico_id')->nullable();
            $t->unsignedBigInteger('criado_por_usuario_id')->nullable(); $t->string('status');
            $t->date('data_inicio')->nullable(); $t->date('data_fim')->nullable();
            $t->decimal('valor_total', 12, 2)->default(0); $t->decimal('preco_tecnico', 12, 2)->nullable();
            $t->decimal('percentual_tecnico', 12, 2)->nullable(); $t->json('precos_detalhados')->nullable();
            $t->boolean('pericia_completa')->default(false); $t->text('observacoes')->nullable();
            $t->timestamp('aceito_em')->nullable(); $t->boolean('disponivel_para_todos')->default(false);
            $t->timestamp('liberado_para_todos_em')->nullable(); $t->timestamps();
        });
        (require database_path('migrations/2026_10_02_170000_add_service_date_and_manual_technician_to_servicos.php'))->up();
        Schema::create('servico_veiculos', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('servico_id');
            foreach (['placa', 'chassi', 'marca', 'modelo', 'marca_modelo'] as $name) $t->string($name)->nullable();
            $t->decimal('preco_total', 12, 2)->default(0); $t->json('reparos_execucao')->nullable();
            $t->json('fotos_veiculo')->nullable(); $t->timestamps();
        });
        Schema::create('pericias', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('servico_id'); $t->string('status');
            $t->timestamp('concluida_em')->nullable(); $t->timestamps();
        });
        Schema::create('servico_logs', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('servico_id'); $t->unsignedBigInteger('oficina_id')->nullable();
            $t->unsignedBigInteger('tecnico_id')->nullable(); $t->string('tipo'); $t->text('descricao')->nullable(); $t->timestamps();
        });
        Schema::create('contas_receber', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('servico_id')->nullable(); $t->string('referencia_veiculo_tipo')->nullable();
            $t->unsignedBigInteger('tecnico_id')->nullable(); $t->unsignedBigInteger('oficina_id')->nullable(); $t->string('origem')->default('aplicativo');
            $t->string('descricao')->nullable(); $t->decimal('valor_servico', 12, 2)->default(0); $t->decimal('valor_plataforma', 12, 2)->nullable();
            $t->string('quem_pagou')->nullable(); $t->string('cliente')->nullable(); $t->string('categoria')->nullable(); $t->string('forma_pagamento')->nullable();
            $t->string('fatura')->nullable(); $t->string('numero_fatura')->nullable(); $t->string('status_fatura')->nullable();
            $t->date('data_emissao')->nullable(); $t->date('data_recebimento')->nullable(); $t->text('observacoes')->nullable();
            $t->date('data_lancamento')->nullable(); $t->date('data_vencimento')->nullable(); $t->string('status')->default('pendente'); $t->timestamps();
        });
        Schema::create('contas_pagar', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('servico_id')->nullable(); $t->string('referencia_veiculo_tipo')->nullable();
            $t->unsignedBigInteger('oficina_id')->nullable(); $t->unsignedBigInteger('tecnico_id')->nullable(); $t->string('origem')->default('aplicativo');
            $t->string('descricao')->nullable(); $t->string('fornecedor')->nullable(); $t->string('categoria')->nullable(); $t->string('forma_pagamento')->nullable();
            $t->string('fatura')->nullable(); $t->string('numero_fatura')->nullable();
            $t->decimal('valor_a_pagar', 12, 2)->default(0); $t->decimal('valor_pago', 12, 2)->default(0); $t->string('comissao')->nullable();
            $t->date('data_emissao')->nullable(); $t->date('data_pagamento')->nullable(); $t->text('observacoes')->nullable();
            $t->date('data_lancamento')->nullable(); $t->date('data_vencimento')->nullable(); $t->string('status')->default('pendente'); $t->timestamps();
        });
        DB::table('oficinas')->insert(['id' => 1, 'nome_fantasia' => 'Oficina Teste', 'cidade' => 'Milão', 'pais' => 'Itália']);
        DB::table('tecnicos')->insert(['id' => 2, 'nome_completo' => 'Técnico Teste']);
    }

    private function service(array $values = []): Servico
    {
        return Servico::create(array_merge(['oficina_id' => 1, 'status' => ServicoStatusEnum::AGUARDANDO, 'data_inicio' => '2026-09-01'], $values));
    }

    private function payload(array $overrides = []): array
    {
        $prices = [];
        foreach (['oficina_carro' => 1000, 'tecnico_carro' => 300, 'oficina_desmontagem' => 200, 'tecnico_desmontagem' => 30] as $key => $amount) {
            $prices[$key] = ['tipo' => 'valor', 'valor' => $amount, 'visivel_app' => false, 'habilitado_preenchimento_app' => false];
        }
        return array_merge([
            'oficina_id' => 1, 'tecnico_id' => null, 'tecnico_nome_manual' => 'João manual', 'data_servico' => '2026-09-15',
            'status' => 'aguardando', 'placa' => 'abc1234', 'chassi' => 'CHASSI', 'marca' => 'Fiat', 'modelo' => 'Uno',
            'tipo_pericia' => 'simples', 'observacoes' => 'Teste', 'fotos_veiculo_existentes' => '{}',
            'precos_detalhados' => json_encode($prices), 'reparos_execucao' => json_encode([
                ['peca' => 'capo', 'tipoReparo' => 'SEM_DANO', 'avaliada' => false, 'amassadosAte2' => 0, 'amassadosAte5' => 0, 'amassadosAcima5' => 0, 'fotos' => []],
                ['peca' => 'teto', 'tipoReparo' => 'SEM_DANO', 'avaliada' => true, 'amassadosAte2' => 0, 'amassadosAte5' => 0, 'amassadosAcima5' => 0, 'fotos' => []],
            ]),
        ], $overrides);
    }

    public function test_saves_date_manual_technician_prices_and_distinct_assessment_states(): void
    {
        $s = $this->service();
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload())
            ->assertOk()->assertJsonPath('data.serviceDate', '2026-09-15')->assertJsonPath('data.technician', 'João manual')
            ->assertJsonPath('data.vehicleRepairs.0.avaliada', false)->assertJsonPath('data.vehicleRepairs.1.avaliada', true)
            ->assertJsonPath('data.calculatedTotals.oficina', 1200)->assertJsonPath('data.calculatedTotals.tecnico', 330);
        $this->assertSame('2026-09-01', $s->fresh()->data_inicio->format('Y-m-d'));
        $this->assertDatabaseHas('servico_veiculos', ['servico_id' => $s->id, 'placa' => 'ABC1234']);
    }

    public function test_registered_technician_clears_manual_name_and_accepts_assignment(): void
    {
        $s = $this->service(['tecnico_nome_manual' => 'Nome antigo']);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['tecnico_id' => 2]))
            ->assertOk()->assertJsonPath('data.manualTechnicianName', null)->assertJsonPath('data.technicianId', 2);
        $this->patchJson("/api/admin/servicos/{$s->id}/aceitar", ['tecnico_id' => 2])
            ->assertOk()->assertJsonPath('data.status', 'aceito')->assertJsonPath('data.canAdminRefuse', false);
        $this->assertNotNull($s->fresh()->aceito_em);
    }

    public function test_switching_from_registered_to_manual_technician_keeps_the_new_name(): void
    {
        $s = $this->service(['tecnico_id' => 2]);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload())
            ->assertOk()->assertJsonPath('data.technicianId', null)->assertJsonPath('data.manualTechnicianName', 'João manual');
    }

    public function test_finalization_syncs_linked_inspections_and_preserves_cancelled_inspections(): void
    {
        $s = $this->service();
        DB::table('pericias')->insert([
            ['id' => 1, 'servico_id' => $s->id, 'status' => 'aberta'],
            ['id' => 2, 'servico_id' => $s->id, 'status' => 'cancelada'],
        ]);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'finalizado']))
            ->assertOk()->assertJsonPath('data.status', 'finalizado');
        $this->assertDatabaseHas('pericias', ['id' => 1, 'status' => 'concluida']);
        $this->assertDatabaseHas('pericias', ['id' => 2, 'status' => 'cancelada']);
        $this->assertNotNull(DB::table('pericias')->where('id', 1)->value('concluida_em'));
        $this->assertDatabaseHas('contas_receber', ['servico_id' => $s->id, 'origem' => 'aplicativo', 'valor_servico' => 1200]);
        $this->assertDatabaseHas('contas_pagar', ['servico_id' => $s->id, 'origem' => 'aplicativo', 'valor_a_pagar' => 330]);
        $this->assertDatabaseCount('contas_receber', 1);
        $this->assertDatabaseCount('contas_pagar', 1);
    }

    public function test_editing_finalized_service_updates_the_same_financial_entries(): void
    {
        $s = $this->service();
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'finalizado']))->assertOk();
        $payload = $this->payload(['status' => 'finalizado']);
        $prices = json_decode($payload['precos_detalhados'], true);
        $prices['oficina_carro']['valor'] = 1500;
        $prices['tecnico_carro']['valor'] = 450;
        $payload['precos_detalhados'] = json_encode($prices);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $payload)->assertOk();
        $this->assertDatabaseCount('contas_receber', 1);
        $this->assertDatabaseCount('contas_pagar', 1);
        $this->assertDatabaseHas('contas_receber', ['servico_id' => $s->id, 'valor_servico' => 1700]);
        $this->assertDatabaseHas('contas_pagar', ['servico_id' => $s->id, 'valor_a_pagar' => 480]);
    }

    public function test_finalized_edit_preserves_invoices_settlement_and_financial_status(): void
    {
        $s = $this->service();
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'finalizado']))->assertOk();
        DB::table('contas_receber')->where('servico_id', $s->id)->update([
            'fatura' => 'Oficina', 'numero_fatura' => 'OF-123', 'status_fatura' => 'paga',
            'data_recebimento' => '2026-10-05', 'status' => 'confirmado', 'referencia_veiculo_tipo' => 'chassi',
        ]);
        DB::table('contas_pagar')->where('servico_id', $s->id)->update([
            'fatura' => 'Técnico', 'numero_fatura' => 'TEC-123', 'valor_pago' => 100,
            'data_pagamento' => '2026-10-06', 'status' => 'confirmado',
        ]);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'finalizado']))->assertOk();
        $this->assertDatabaseCount('contas_receber', 1);
        $this->assertDatabaseCount('contas_pagar', 1);
        $this->assertDatabaseHas('contas_receber', [
            'numero_fatura' => 'OF-123', 'status_fatura' => 'paga', 'data_recebimento' => '2026-10-05',
            'status' => 'confirmado', 'referencia_veiculo_tipo' => 'chassi',
        ]);
        $id = DB::table('contas_pagar')->where('servico_id', $s->id)->value('id');
        $this->getJson("/api/admin/contas-pagar/{$id}")->assertOk()
            ->assertJsonPath('data.paymentDate', '2026-10-06')->assertJsonPath('data.settleDate', '2026-10-06')
            ->assertJsonPath('data.invoiceNumber', 'TEC-123')->assertJsonPath('data.amountPaid', 100)
            ->assertJsonPath('data.status', 'confirmado');
    }

    public function test_status_transition_outside_details_generates_finance_with_legacy_percentage(): void
    {
        $s = $this->service(['valor_total' => 1000, 'percentual_tecnico' => 30, 'tecnico_id' => 2]);
        $s->update(['status' => ServicoStatusEnum::FINALIZADO]);
        $this->assertDatabaseHas('contas_receber', ['servico_id' => $s->id, 'valor_servico' => 1000]);
        $this->assertSame('2026-09-01', \App\Models\ContaReceber::where('servico_id', $s->id)->firstOrFail()->data_lancamento->format('Y-m-d'));
        $id = DB::table('contas_receber')->where('servico_id', $s->id)->value('id');
        $this->getJson("/api/admin/contas-receber/{$id}")->assertOk()->assertJsonPath('data.serviceDate', '2026-09-01');
        $this->assertDatabaseHas('contas_pagar', ['servico_id' => $s->id, 'valor_a_pagar' => 300]);
        $s->update(['status' => ServicoStatusEnum::CONCLUIDO]);
        $this->assertDatabaseCount('contas_receber', 1);
        $this->assertDatabaseCount('contas_pagar', 1);
    }

    public function test_only_the_last_pending_inspection_generates_finance(): void
    {
        $s = $this->service(['status' => ServicoStatusEnum::EM_EXECUCAO, 'valor_total' => 1000, 'preco_tecnico' => 300]);
        DB::table('pericias')->insert([
            ['id' => 1, 'servico_id' => $s->id, 'status' => 'em_execucao'],
            ['id' => 2, 'servico_id' => $s->id, 'status' => 'aberta'],
        ]);
        \App\Models\Pericia::findOrFail(1)->update(['status' => \App\Enums\PericiaStatusEnum::CONCLUIDA]);
        $this->assertDatabaseCount('contas_receber', 0);
        $this->assertDatabaseCount('contas_pagar', 0);
        \App\Models\Pericia::findOrFail(2)->update(['status' => \App\Enums\PericiaStatusEnum::CONCLUIDA]);
        $this->assertSame(ServicoStatusEnum::FINALIZADO, $s->fresh()->status);
        $this->assertDatabaseHas('contas_receber', ['servico_id' => $s->id, 'valor_servico' => 1000]);
        $this->assertDatabaseHas('contas_pagar', ['servico_id' => $s->id, 'valor_a_pagar' => 300]);
    }

    public function test_finalized_service_status_cannot_be_reopened_from_the_edit_form(): void
    {
        $s = $this->service(['status' => ServicoStatusEnum::FINALIZADO]);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'aguardando']))
            ->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->assertSame(ServicoStatusEnum::FINALIZADO, $s->fresh()->status);
    }

    public function test_invalid_photo_rolls_back_service_and_vehicle_before_finalization(): void
    {
        $s = $this->service(['data_servico' => '2026-09-01']);
        $s->veiculos()->create(['placa' => 'ANTIGA', 'preco_total' => 10, 'reparos_execucao' => []]);
        $payload = $this->payload(['status' => 'finalizado']);
        $repairs = json_decode($payload['reparos_execucao'], true);
        $repairs[1]['fotos'] = ['servicos/outro/foto.jpg'];
        $payload['reparos_execucao'] = json_encode($repairs);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $payload)->assertUnprocessable();
        $this->assertSame(ServicoStatusEnum::AGUARDANDO, $s->fresh()->status);
        $this->assertSame('2026-09-01', $s->fresh()->data_servico->format('Y-m-d'));
        $this->assertDatabaseHas('servico_veiculos', ['servico_id' => $s->id, 'placa' => 'ANTIGA', 'preco_total' => 10]);
        $this->assertDatabaseCount('servico_logs', 0);
    }

    public function test_date_filter_uses_the_saved_service_date_with_legacy_fallback(): void
    {
        $new = $this->service(['data_servico' => '2026-09-15']);
        $legacy = $this->service(['data_inicio' => '2026-09-15']);
        $this->service(['data_servico' => '2026-10-01']);
        $this->getJson('/api/admin/servicos?data_inicial=2026-09-15&data_final=2026-09-15')
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);
        $this->assertNotEquals($new->id, $legacy->id);
    }

    public function test_cancelled_service_cannot_be_finalized_by_the_new_button(): void
    {
        $s = $this->service(['status' => ServicoStatusEnum::CANCELADO]);
        $this->postJson("/api/admin/servicos/{$s->id}/detalhes", $this->payload(['status' => 'finalizado']))->assertUnprocessable();
        $this->assertSame(ServicoStatusEnum::CANCELADO, $s->fresh()->status);
    }
}
