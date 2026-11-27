# Binotto — acompanhamento das melhorias de 26/11/2026

## Situação inicial

- Repositório: `Lucaspaiva00/BINOTTO`, branch remota `main` no commit `f78872f0eebc46678bc282aee5c51350b39602a6` (conferido em 27/11/2026).
- Branch de trabalho: `codex/binotto-melhorias-2026-11-27`.
- O trabalho começou em uma worktree isolada. Outras cópias locais, incluindo uma com alterações sem commit e outra com commits ainda não publicados, foram preservadas.
- `render.yaml` identifica os serviços `binotto-api` e `binotto-web`. O painel da Render mostra ambos ativos e com último deploy bem-sucedido no commit `4c3decc8830a65b12e3c9a74e6c5feb2d1a26cda`, há cerca de três dias.
- A aplicação em `https://binotto-web.onrender.com/dashboard` abriu. A verificação não destrutiva `https://binotto-api.onrender.com/up` respondeu `Application up`.
- O painel da Render exibe um aviso `Payment failed` no workspace. Nenhum dado de cobrança foi alterado; a situação pode afetar futuros deploys.
- As gravações anexadas têm aproximadamente 11min29s e 12min09s. A inspeção visual de quadros mostra telas/documentos relacionados ao escopo escrito. Não foi possível obter uma transcrição confiável do áudio nesta execução; portanto, nenhum pedido verbal adicional foi tratado como confirmado.

## Acompanhamento por módulo

| Módulo | Status | Registro |
|---|---|---|
| Financeiro — cancelamento/reativação | EM DESENVOLVIMENTO | O código local guarda os estados anteriores, preserva dados de faturas/pagamentos e tenta restaurar as contas sem duplicar lançamentos. A ação de reativar está na tela de detalhes. Migration e regressão Laravel aguardam execução. |
| Usuários | EM DESENVOLVIMENTO | O título do filtro da listagem foi reduzido para “Nome”. Reestruturação dos perfis, documentos, exclusão protegida e mostradores ainda pendentes. |
| Serviços | EM DESENVOLVIMENTO | Ajustados rótulos/preço e total filtrado na listagem; campos de marca e modelo deixaram de ser derivados um do outro ao editar. Cancelamento/reativação financeira está em código local. Seletores, vínculo de perícia e demais solicitações pendentes. |
| Perícias | EM DESENVOLVIMENTO | A listagem ganhou filtros nas colunas de data, oficina, perito, cidade, país, veículo, placa, chassi, preço, desmontagem e observação; preço/desmontagem alinhados à direita. O campo de perito pesquisa nomes existentes e permite adicionar um novo à lista sem duplicar nomes. Build aprovado; endpoints e integração aguardam teste Laravel. Detalhes da perícia ainda pendentes. |
| Financeiro — tabelas, filtros e destaques | EM DESENVOLVIMENTO | Contas a Receber: removidos indicadores solicitados e botão de novo lançamento; filtros adicionados a modelo, placa, chassi e valor total; saldo, vencido e faturas em aberto calculados no backend sobre todos os registros filtrados. Contas a Pagar: filtro superior removido, filtros nas colunas e três destaques calculados no backend sobre todos os resultados filtrados. Testes da API pendentes. |
| Configurações e mostradores | EM DESENVOLVIMENTO | Reordenação das abas do Financeiro adicionada às configurações e persistida no navegador. Mostradores de Usuários, Serviços e Perícias ainda pendentes. |
| Integração com o aplicativo | PENDENTE | Compatibilidade não foi validada nesta execução. Nenhum build Expo foi publicado. |
| Vídeos — pedidos verbais | BLOQUEADO | Faltou transcrição de áudio verificável; pedidos adicionais não serão inferidos apenas de quadros parciais. |
| Publicação e validação em produção | PENDENTE | Esta branch ainda não foi publicada, e a migration não foi executada em produção. Os serviços existentes estão ativos. |

## Alterações locais desta etapa

- `api/database/migrations/2026_11_27_150000_add_finance_status_before_service_cancellation.php`: adiciona campos anuláveis para guardar o status anterior do serviço e das contas relacionadas.
- `api/app/Http/Controllers/Api/Admin/ServicoDetalhesController.php`: salva o status anterior ao cancelamento e valida a reativação direta de serviço que já estava finalizado/concluído.
- `api/app/Support/ServicoFinanceiro.php`: restaura o status financeiro anterior ou usa valores de pagamento/fatura como fallback para dados antigos sem histórico.
- `api/app/Models/Servico.php`, `api/app/Models/ContaReceber.php`, `api/app/Models/ContaPagar.php` e `api/app/Http/Resources/Api/Admin/ServicoResource.php`: persistem/exibem o estado necessário à reativação.
- `web/src/pages/servicos/ServicoDetail.tsx` e `web/src/types/service.ts`: adicionam ação de reativação com confirmação.
- `api/tests/Feature/AdminServiceImprovementsTest.php`: adiciona regressão para dois ciclos de cancelamento/reativação, preservação de fatura/pagamento e ausência de lançamentos duplicados.
- `api/routes/api.php`: removida uma rota de desenvolvimento sem uso que continha uma credencial embutida; o container já executa as migrations no fluxo de inicialização.
- Listagens financeiras e de Perícias receberam filtros por coluna e os indicadores de Contas a Pagar passaram a considerar todos os registros filtrados.
- Contas a Receber agora também calcula seus três indicadores no backend, considerando o conjunto completo filtrado.
- Na criação de perícia, a pesquisa de perito usa a lista Usuários > Perito e oferece cadastro de nomes ausentes; API e fixture de regressão adicionados.
- `web/src/constants/financeTabPreferences.ts`, `web/src/pages/Settings.tsx` e `web/src/pages/financeiro/Financeiro.tsx`: salvam e aplicam a ordem das abas do Financeiro no navegador.

## Verificações executadas

- `npm run build` em `web/`: aprovado. O build avisou que o bundle JavaScript excede 500 kB.
- `npm run lint` em `web/`: concluído com avisos preexistentes; nenhum erro foi reportado.
- `npm run test:services` em `web/`: aprovado.
- `git diff --check`: aprovado.
- Após os ajustes recentes em filtros de Perícias/Financeiro e ordem das abas, `npm run build`, `npm run lint` e `npm run test:services` foram executados novamente: build e teste passaram; lint reportou apenas avisos já existentes. O build ainda alerta que o bundle JS excede 500 kB.
- Após os indicadores globais de Contas a Receber, build, lint, teste `test:services` e `git diff --check` passaram novamente (lint somente com avisos preexistentes).
- Testes Laravel e validação da migration: BLOQUEADOS nesta máquina porque PHP e `composer` não estão instalados e `api/vendor` não está presente.

## Commits e publicação

- `a74e9a5` — `fix(finance): preserve service ledger state on reactivation`.
- `3e3cfba` — `feat(finance): add column filters and dashboard totals`.
- `706dad6` — `fix(ui): show filtered service totals and update labels`.
- `a5bdc69` — `fix(finance): calculate receivable summaries across filters`.
- `e375858` — `feat(pericias): search and register inspectors`.
- `2715d90` — `security(api): remove unused credentialed setup route`.
- As alterações de `e375858` e `2715d90` foram sincronizadas na branch remota como o commit de snapshot `52753afa433914a30bd3fb2f035edacf4fd7e226`.
- `047e945`, `f009eb5`, `340ba66` e `93d9a8f` — commits locais de documentação do acompanhamento e checkpoints.
- A branch remota `codex/binotto-melhorias-2026-11-27` foi criada em 27/11/2026, baseada em `f78872f0eebc46678bc282aee5c51350b39602a6` de `main`. Os checkpoints remotos foram `1d09c7547143307473dabbae5825a8266ce69dc0`, `8c77f5e5046714e646c16f6f365d7bab98d79abe` e `52753afa433914a30bd3fb2f035edacf4fd7e226`; a branch contém as alterações registradas acima. Os commits locais de implementação não foram preservados individualmente no histórico remoto, pois a integração sincronizou snapshots Git.
- O push via terminal não autenticou. Após autorização direta do usuário no chat, o estado final foi publicado usando a integração GitHub.
- Não houve alteração em `main`, execução de migration ou deploy. A publicação permanece pendente dos testes da API e da conclusão do escopo restante.

## Pendências antes de produção

- Executar PHPUnit e validar a migration em banco de teste compatível com produção.
- Concluir a revisão dos módulos Usuários, Serviços, Perícias, Financeiro e Configurações.
- Obter transcrição verificável dos dois vídeos e registrar pedidos adicionais com timestamps, se houver.
- Resolver o aviso de cobrança da Render antes de depender de novos deploys.
- Nenhum deploy desta branch deve ser considerado feito até a verificação de produção.
- Executar regressão visual e funcional no navegador e validar a comunicação do aplicativo com a API.
- Registrar os hashes dos commits e os resultados dos deploys após a execução dessas etapas.
