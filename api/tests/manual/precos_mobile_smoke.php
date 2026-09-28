<?php
/** Independente do banco/Composer: php api/tests/manual/precos_mobile_smoke.php */
require __DIR__.'/../../app/Support/ServicoPrecos.php';

use App\Support\ServicoPrecos as P;

function check(bool $condition, string $message): void {
    global $checks;
    if (! $condition) throw new RuntimeException($message);
    $checks++;
}
function config(string $item, string $side, string $type, float $value, bool $visible = false, bool $fill = false): array {
    return ['tipo' => $type, 'valor' => $value, 'visivel_app' => $visible, 'habilitado_preenchimento_app' => $fill];
}
function prices(): array {
    return [
        'oficina_carro' => config('carro', 'oficina', 'valor', 1000, false, true),
        'tecnico_carro' => config('carro', 'tecnico', 'porcentagem', 30, false, true),
        'oficina_desmontagem' => config('desmontagem', 'oficina', 'valor', 200, true, false),
        'tecnico_desmontagem' => config('desmontagem', 'tecnico', 'porcentagem', 15, false, true),
    ];
}
$checks = 0;
$p = prices();
$c = P::calcular($p);
check($c['carro'] === ['oficina'=>1000.0,'tecnico'=>300.0], 'Cálculo direto carro');
check($c['desmontagem'] === ['oficina'=>200.0,'tecnico'=>30.0], 'Cálculo desmontagem independente');
$p['oficina_carro'] = config('carro','oficina','porcentagem',40,false,true);
$p['tecnico_carro'] = config('carro','tecnico','valor',400,false,true);
$c = P::calcular($p);
check($c['carro']['oficina'] === 1000.0, 'Inverso oficina 40% -> 1000');
check($c['carro']['tecnico'] === 400.0, 'Inverso técnico -> 400');
check($c['desmontagem']['tecnico'] === 30.0, 'Inverso não altera desmontagem');
$p['oficina_carro']['valor'] = 33.0;
$p['tecnico_carro']['valor'] = 333.33;
check(P::calcular($p)['carro']['oficina'] === 1010.09, 'Arredondamento reverso 33%');
$p = prices();
$p['tecnico_carro']['valor'] = 0;
check(P::calcular($p)['carro']['tecnico'] === 0.0, 'Zero técnico válido');
$p['tecnico_carro']['valor'] = 100;
check(P::calcular($p)['carro']['tecnico'] === 1000.0, 'Percentual 100 válido');
$p['tecnico_carro']['valor'] = 101;
try {P::calcular($p);throw new RuntimeException('101% aceito indevidamente');} catch (InvalidArgumentException $e) {$checks++;}
$p = prices();
$p['oficina_carro']['tipo'] = 'porcentagem';
try {P::calcular($p);throw new RuntimeException('2 percentuais aceitos');} catch (InvalidArgumentException $e) {$checks++;}
$p['tecnico_carro']['tipo'] = 'valor';
$p['oficina_carro']['valor'] = 0;
try {P::calcular($p);throw new RuntimeException('Divisão por zero aceita');} catch (InvalidArgumentException $e) {$checks++;}
$p = prices();
$p['oficina_carro']['valor'] = -1;
try {P::calcular($p);throw new RuntimeException('Valor negativo aceito');} catch (InvalidArgumentException $e) {$checks++;}
$p = prices();
$p['oficina_carro']['valor'] = 99999999;
$p['tecnico_carro']['valor'] = 100;
check(P::calcular($p)['carro']['tecnico'] === 99999999.0, 'Máximo válido');
$p['oficina_carro']['valor'] = 100000000;
try {P::calcular($p);throw new RuntimeException('Limite aceito');} catch (InvalidArgumentException $e) {$checks++;}
$p = prices();
$t = P::paraPerfil($p, 'TECNICO');
check($t['oficina_carro'] === null, 'Técnico não lê carro da oficina oculto');
check($t['tecnico_carro']['valor'] === 30.0, 'Técnico preenche o próprio carro');
check($t['oficina_desmontagem']['valor'] === 200.0, 'Técnico vê desmontagem compartilhada');
check($t['tecnico_desmontagem']['valor'] === 15.0, 'Técnico preenche desmontagem própria');
$o = P::paraPerfil($p, 'OFICINA');
check($o['tecnico_carro'] === null, 'Oficina não lê carro do técnico oculto');
check($o['tecnico_desmontagem'] === null, 'Oficina não lê desmontagem do técnico');
check($o['oficina_carro']['valor'] === 1000.0, 'Oficina edita próprio carro');
check($o['oficina_desmontagem'] === null, 'Campo desabilitado some do app da oficina');
$c = P::calculadosParaPerfil($p, 'TECNICO');
check($c['carro']['oficina'] === null, 'Resultado calculado privado da oficina');
check($c['carro']['tecnico'] === 300.0, 'Técnico pode ler resultado próprio');
check($c['desmontagem']['oficina'] === 200.0, 'Resultado compartilhado permitido');
$c = P::calculadosParaPerfil($p, 'OFICINA');
check($c['carro']['tecnico'] === null, 'Resultado calculado privado do técnico');
check($c['desmontagem']['oficina'] === null, 'Resultado desabilitado da oficina');
$p['tecnico_carro']['visivel_app'] = true;
check(P::paraPerfil($p, 'OFICINA')['tecnico_carro']['valor'] === 30.0, 'Compartilhamento do técnico é independente de habilitação');
$p['oficina_carro']['habilitado_preenchimento_app'] = false;
check(P::paraPerfil($p, 'OFICINA')['oficina_carro'] === null, 'Desabilita preenchimento sem alterar preço armazenado');
check(P::calcular($p)['carro']['oficina'] === 1000.0, 'Ocultação não destrói cálculo');
$old = ['oficina_carro' => ['tipo'=>'valor','valor'=>500,'visivel_app'=>true]];
check(P::normalizar($old)['oficina_carro']['habilitado_preenchimento_app'] === false, 'Legado recebe flag segura false');
$legacyTech = ['tecnico_carro' => ['tipo'=>'valor','valor'=>500,'visivel_app'=>true]];
check(P::normalizar($legacyTech)['tecnico_carro']['visivel_app'] === false, 'Visibilidade legada do técnico não vaza para a oficina');
check(P::calcular($old)['carro']['oficina'] === null, 'Legado parcial não tem base inventada');
check(P::calcularSeguro(['oficina_carro'=>['tipo'=>'porcentagem','valor'=>30],'tecnico_carro'=>['tipo'=>'porcentagem','valor'=>40]])['carro']['oficina'] === null, 'Legado inválido não causa 500 na consulta');
check(P::paraPerfil($p, 'ADMIN') === P::normalizar($p), 'Administrador consulta configuração completa');
fwrite(STDOUT, "PASS: {$checks} regras financeiras, arredondamento e visibilidade testadas.\n");
