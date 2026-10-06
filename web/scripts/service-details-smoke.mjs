import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const helpers = await server.ssrLoadModule('/src/pages/servicos/serviceDetails.ts');
  const { normalizeServiceRepairs, buildServiceDetailsFormData, defaultPrices, resolveDetailedPrices, localTodayISO, SERVICE_PARTS_ORDER } = helpers;
  const initial = normalizeServiceRepairs();
  assert(SERVICE_PARTS_ORDER.every(id => initial[id].assessed === false));
  const saved = normalizeServiceRepairs([
    { peca: 'capo', tipoReparo: 'SEM_DANO', avaliada: true },
    { peca: 'teto', tipoReparo: 'PDR', amassadosAte2: 3 },
    { peca: 'porta_dianteira_esq', tipoReparo: 'SEM_DANO', avaliada: false },
  ]);
  assert.equal(saved.capo.assessed, true);
  assert.equal(saved.teto.assessed, true); // Registros legados continuam avaliados.
  assert.equal(saved.teto.dentsUpTo2, 3);
  assert.equal(saved.porta_dianteira_esq.assessed, false);
  assert.equal(saved.porta_dianteira_dir.assessed, false);

  const prices = defaultPrices(1000, null, 30);
  prices.oficina_desmontagem.valor = '200';
  prices.tecnico_desmontagem.valor = '30';
  const totals = resolveDetailedPrices(prices);
  assert.deepEqual(totals, { carro: { oficina: 1000, tecnico: 300 }, desmontagem: { oficina: 200, tecnico: 30 } });
  assert.equal(totals.carro.oficina + totals.desmontagem.oficina - totals.carro.tecnico - totals.desmontagem.tecnico, 870);
  assert.deepEqual(resolveDetailedPrices(defaultPrices()), { carro: { oficina: 0, tecnico: 0 }, desmontagem: { oficina: 0, tecnico: 0 } });
  prices.tecnico_carro.valor = '101';
  assert.equal(resolveDetailedPrices(prices), null);
  prices.tecnico_carro.valor = '30';
  prices.tecnico_sugestao_carro.habilitado_preenchimento_app = true;
  prices.oficina_carro.visivel_app = true;
  const form = { workshopId: '1', technicianId: '', manualTechnicianName: ' João ', serviceDate: '2026-09-15', status: 'finalizado', plate: 'ABC1234', chassis: '', brand: 'Fiat', vehicleModel: 'Uno', notes: '', inspectionType: 'simples', vehiclePhotos: helpers.emptyVehiclePhotos(), detailedPrices: prices };
  const data = buildServiceDetailsFormData(form, saved);
  assert.equal(data.get('data_servico'), '2026-09-15');
  assert.equal(data.get('tecnico_nome_manual'), 'João');
  assert.equal(data.get('status'), 'finalizado');
  assert.equal(data.get('tecnico_id'), '');
  const repairs = JSON.parse(data.get('reparos_execucao'));
  assert.equal(repairs.find(part => part.peca === 'capo').avaliada, true);
  assert.equal(repairs.find(part => part.peca === 'porta_dianteira_esq').avaliada, false);
  assert.equal(repairs.find(part => part.peca === 'teto').amassadosAte2, 3);
  const serializedPrices = JSON.parse(data.get('precos_detalhados'));
  assert.equal(serializedPrices.oficina_carro.visivel_app, true);
  assert.equal(serializedPrices.tecnico_sugestao_carro.habilitado_preenchimento_app, true);
  assert.equal(serializedPrices.tecnico_carro.tipo, 'porcentagem');
  form.technicianId = '2';
  assert.equal(buildServiceDetailsFormData(form, saved).get('tecnico_nome_manual'), '');
  const { toForm, toPayload } = await server.ssrLoadModule('/src/pages/financeiro/tabs/payableForm.ts');
  const payable = { id: 7, origin: 'aplicativo', serviceId: 3, technicianId: 2, workshopId: 1,
    amountDue: 330, amountPaid: 100, paymentDate: '2026-10-06', dueDate: '2026-10-10', status: 'pendente',
    invoice: 'Fatura técnico', invoiceNumber: 'TEC-123', commission: 'Reparação: 30%' };
  const payableForm = toForm(payable);
  assert.equal(payableForm.settleDate, '2026-10-06');
  const payablePayload = toPayload(payableForm);
  assert.equal(payablePayload.data_pagamento, '2026-10-06');
  assert.equal(payablePayload.valor_pago, 100);
  assert.equal(payablePayload.fatura, 'Fatura técnico');
  assert.equal(payablePayload.numero_fatura, 'TEC-123');
  assert.equal(payablePayload.comissao, 'Reparação: 30%');
  assert.equal(toForm({ ...payable, paymentDate: undefined, settleDate: '2026-10-05' }).settleDate, '2026-10-05');
  assert.equal(toPayload(toForm({ ...payable, paymentDate: null, settleDate: null })).data_pagamento, null);
  const RealDate = globalThis.Date;
  const priorTimezone = process.env.TZ;
  try {
    process.env.TZ = 'America/Sao_Paulo';
    globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : ['2026-10-03T01:00:00Z'])); } };
    assert.equal(localTodayISO(), '2026-10-02');
  } finally { globalThis.Date = RealDate; if (priorTimezone === undefined) delete process.env.TZ; else process.env.TZ = priorTimezone; }
  console.log('PASS: reparos novos/legados, peças não avaliadas, percentuais, totais, zeros, persistência, visibilidade, nome manual e data local.');
} finally { await server.close(); }
