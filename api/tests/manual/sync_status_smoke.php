<?php
/** Independente do banco e do Composer: php api/tests/manual/sync_status_smoke.php */
require __DIR__.'/../../app/Enums/PericiaStatusEnum.php';
require __DIR__.'/../../app/Enums/ServicoStatusEnum.php';
require __DIR__.'/../../app/Support/ServicoPericiaStatusMap.php';

use App\Enums\ServicoStatusEnum as S;
use App\Enums\PericiaStatusEnum as P;
use App\Support\ServicoPericiaStatusMap as M;

$expected = [
    S::AGUARDANDO->value => P::ABERTA, S::AGUARDANDO_APROVACAO->value => P::ABERTA,
    S::ACEITO->value => P::ABERTA, S::EM_BREVE->value => P::ABERTA,
    S::EM_EXECUCAO->value => P::EM_EXECUCAO, S::RETRABALHO->value => P::EM_EXECUCAO,
    S::FINALIZADO->value => P::CONCLUIDA, S::CONCLUIDO->value => P::CONCLUIDA,
    S::CANCELADO->value => P::CANCELADA,
];
$tests = 0;
foreach (S::cases() as $status) {
    if (M::daSituacaoServico($status) !== $expected[$status->value]) throw new RuntimeException('Erro: '.$status->value);
    $tests++;
}
$cases = [
    [S::ACEITO, [P::ABERTA], null],
    [S::ACEITO, [P::EM_EXECUCAO, P::ABERTA], S::EM_EXECUCAO],
    [S::EM_EXECUCAO, [P::CONCLUIDA, P::ABERTA], null],
    [S::EM_EXECUCAO, [P::CONCLUIDA, P::CONCLUIDA], S::FINALIZADO],
    [S::CONCLUIDO, [P::CONCLUIDA], S::CONCLUIDO],
    [S::EM_EXECUCAO, [P::CANCELADA, P::ABERTA], null],
    [S::ACEITO, [P::CANCELADA, P::CANCELADA], S::CANCELADO],
    [S::RETRABALHO, [P::EM_EXECUCAO], S::RETRABALHO],
    [S::AGUARDANDO, [], null],
];
foreach ($cases as [$current, $pericias, $expectedStatus]) {
    if (M::daSituacaoPericias($current, $pericias) !== $expectedStatus) throw new RuntimeException('Erro no conjunto '.json_encode($pericias));
    $tests++;
}
fwrite(STDOUT, "PASS: {$tests} regras de sincronização testadas.\n");
