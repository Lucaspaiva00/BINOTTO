# Melhorias de serviços — 02/10/2026

Implementa os pedidos dos prints do cliente: salvar no topo/rodapé e voltar à lista; data editável preenchida com o dia local; veículo em quatro colunas no computador; técnico cadastrado ou nome manual; aceite verde e recusa vermelha; finalização no rodapé; tabela Fatura/Técnico/Sugestão e totais Oficina/Técnico/Empresa; carro branco não avaliado, azul PDR, laranja pintura e cinza sem danos; seleção geral com segundo clique para desfazer.

A edição completa usa uma transação na API de detalhes. Finalizar salva os detalhes e o status juntos e mantém a sincronização existente das perícias. O seletor de edição não oferece Aceito, Concluído, Retrabalho ou Finalizado; os valores permanecem válidos para registros antigos, filtros e aplicativo. Aceitar salva as alterações antes de confirmar o técnico e atualiza o histórico.

## Banco e publicação

A migration `2026_10_02_170000_add_service_date_and_manual_technician_to_servicos.php` adiciona dois campos opcionais: `data_servico` e `tecnico_nome_manual`. O script de inicialização Docker já executa `php artisan migrate --force`. Em ambientes com implantação manual, executar a migration antes de disponibilizar o painel novo. Datas antigas usam início/criação como alternativa; o período de execução não é alterado pela data administrativa. A busca por datas na lista usa a mesma data exibida.

A marca `avaliada` é persistida no JSON de reparos. Peças ausentes começam não avaliadas; reparos antigos sem a marca continuam avaliados. O nome manual não cria uma conta ou um vínculo fictício com técnico cadastrado.

## Validação

- `cd web && npm run build && npm run lint && npm run test:services`
- `cd api && php vendor/bin/phpunit --filter AdminServiceImprovementsTest`
- `php api/tests/manual/precos_mobile_smoke.php`
- `php api/tests/manual/sync_status_smoke.php`

Também validado no navegador com dados locais simulados: salvar superior/inferior, lista de status, data na listagem, nomes manuais, totais, alternância PDR/Pintura, aceite, falha de gravação sem sair da edição, finalização e layout no celular.

## Pendência do cliente

A regra futura após clicar em Recusar não foi definida. A implementação mantém a operação existente de liberar o técnico e reabrir a solicitação, e desabilita o botão depois do aceite na interface.
