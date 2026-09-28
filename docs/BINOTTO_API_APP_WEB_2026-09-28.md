# Integração Binotto: APP ↔ API ↔ Painel WEB — 28/09/2026

Este documento acompanha a atualização **WEB e API**. O aplicativo React Native continua com o desenvolvedor mobile e **não teve seu código alterado** nesta entrega.

## Contrato compartilhado

A API de produção já tem a mesma origem: `https://binotto-api.onrender.com`. O painel acessa `/api/admin`, e o APP acessa `/api/mobile`. Ambos persistem `servicos`, `servico_veiculos` e `pericias` relacionados por `pericias.servico_id`.

### Sincronização de status implementada no backend

- Serviço `aguardando`, `aguardando_aprovacao`, `aceito` ou `em_breve` → perícia `aberta`.
- Serviço `em_execucao` ou `retrabalho` → perícia `em_execucao`.
- Serviço `finalizado` ou `concluido` → perícia `concluida`, **mantendo as perícias já canceladas**.
- Serviço `cancelado` → perícia `cancelada`.
- Perícia `em_execucao` → serviço `em_execucao` (preserva `retrabalho`).
- Quando **todas** as perícias estão concluídas, o serviço avança para `finalizado` (a oficina ainda deve confirmar para `concluido`).
- Quando **todas** as perícias estão canceladas, o serviço fica `cancelado`.
- Perícia `aberta` não regride um serviço já aceito/finalizado; ações explícitas de reabertura devem ser feitas pelo serviço.
- Mobile: salvar a execução de uma perícia **não deve finalizar** o serviço se outras perícias estiverem pendentes.

Status é sincronizado **no servidor, no próximo GET**. Atualização visual automática em tempo real depende do APP atualizar a lista/detalhe após a resposta de uma mutação, no foco da tela, ou por notificações/polling existentes.

### Novos campos em `servico_veiculos`

- `marca`, `modelo`: campos separados, mantendo `marca_modelo` para compatibilidade com o APP antigo.
- `fotos_veiculo`: mapa de caminhos internos de imagem (`frente_motorista`, `traseira_carona`, `placa`, `chassi`, opcionais `marca`, `modelo`).
- Nas respostas brutas ao APP, `fotos_veiculo_urls` é o mapa de URLs para exibição e `reparos_execucao_urls` expõe os reparos com fotos em URL. As propriedades antigas continuam disponíveis.
- `reparos_execucao` armazena `amassadosAte2`, `amassadosAte5`, `amassadosAcima5` (inteiros de 0 a 9999), observações, tipo de reparo e até três fotos por peça. Os campos legados `quantidadeAmassados`, `quantidadeImpactosMaior25` e `quantidadeImpactosMenor25` são preservados; **não converter automaticamente unidades antigas para centímetros**.

### Preços

Em `servicos.precos_detalhados`:

```json
{
  "oficina_desmontagem": {"tipo":"valor","valor":100,"visivel_app":false},
  "oficina_carro": {"tipo":"valor","valor":1000,"visivel_app":false},
  "tecnico_desmontagem": {"tipo":"porcentagem","valor":20,"visivel_app":true},
  "tecnico_carro": {"tipo":"porcentagem","valor":30,"visivel_app":true}
}
```

**ATUALIZADO em 28/09 após confirmação do Juliano:** ver `docs/BINOTTO_FINANCEIRO_APP_WEB_2026-09-28.md`. Agora existe cálculo de cotação direto e inverso, sem gerar faturamento automático. O botão `OCULTAR PREÇO` afeta o perfil oposto e `habilitado_preenchimento_app` controla separadamente a presença e gravação do campo no perfil próprio. As regras financeiras mais recentes prevalecem sobre o exemplo legado acima.

A configuração antiga era: `tipo` aceita `valor` ou `porcentagem` (0–100%). Os percentuais são **configuração**, sem lançamento financeiro automático: falta a confirmação contratual da base de cálculo. Para o usuário `TECNICO`, valores com `visivel_app=false` são enviados como `null`; os valores antigos de carro/técnico também são filtrados. O APP deve **ocultar controles e valores nulos**, não exibir `0,00` no lugar. A oficina mantém acesso aos seus próprios valores conforme autorização atual.

### Endpoints administrativos novos

- `POST /api/admin/servicos/{id}/detalhes` — `multipart/form-data`: `placa`, `chassi`, `marca`, `modelo`, `observacoes`, `tipo_pericia` (`simples` ou `completa`), `reparos_execucao` (JSON), `precos_detalhados` (JSON), `fotos_veiculo_existentes` (JSON), fotos `fotos_veiculo[placa]`, `fotos_veiculo[chassi]`, `fotos_veiculo[frente_motorista]`, `fotos_veiculo[traseira_carona]` e `fotos_reparos[capo][]` etc.
- `PATCH /api/admin/servicos/{id}/aceitar` com `{ "tecnico_id": 123 }` — registro de aceite **administrativo** para técnico designado; não afirma que o técnico pressionou Aceitar no aplicativo.
- `PATCH /api/admin/servicos/{id}/recusar` — libera a vaga no painel, sem executar uma recusa pessoal em nome do técnico.

Os endpoints mobile de aceite/recusa de técnico continuam existindo e acionam os mesmos eventos de status em `Servico`.

## Migração e implantação

O release contém `api/database/migrations/2026_09_28_210000_service_details_and_status.php`. Depois de **backup do banco** e deploy da API, executar `php artisan migrate --force` e `php artisan optimize:clear` no Shell da Render. Confirmar que o disco público `/storage` é persistente/configurado antes de testar uploads. Implantar a API **antes** do painel atualizado.

## Testes cruzados necessários antes de considerar produção homologada

1. Criar solicitação no painel; conferir dados e status no APP; aceitar no APP; atualizar painel e confirmar status/técnico.
2. Iniciar e finalizar a perícia no APP; verificar status e dados no painel, inclusive com duas perícias vinculadas ao mesmo serviço.
3. Cancelar o serviço pelo APP ou painel e confirmar cancelamento das perícias vinculadas sem perder histórico.
4. Anexar e remover fotos do veículo e fotos por peça no painel; reabrir o cadastro; consultar URLs no APP.
5. Testar quatro preços com `visivel_app` ligado/desligado e usuários de perfis diferentes; garantir que valores ocultos **não sejam retornados** para técnico.
6. Conferir compatibilidade de serviço antigo com `marca_modelo`, reparos/fotos legados e sem `precos_detalhados`.

*Observação:* alterações da interface mobile e atualização de telas em tempo real ficam para o desenvolvedor do APP. O build completo WEB/API e os testes integrados no banco real são obrigatórios antes da homologação final.
