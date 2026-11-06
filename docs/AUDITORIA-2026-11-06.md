# BINOTTO — acompanhamento de auditoria — 06/11/2026

Esta é uma entrega parcial verificável. Nenhum item foi homologado somente por commit ou compilação. Nenhum dado real foi excluído. Nenhum envio às lojas foi realizado.

| Funcionalidade | Problema identificado | Correção realizada | Commit | Resultado dos testes | Status da publicação |
|---|---|---|---|---|---|
| Compilação APP | JSX inválido no PrivateNavigator; profileId nulo incompatível em duas telas | JSX e tipos corrigidos | 0cabbb8 | TypeScript passou; bundles Android/iOS gerados | main; sem build assinado |
| Item 4 — cartões técnico | Checagem impedida por tipagem; validação visual pendente | profileId normalizado | 0cabbb8 | TypeScript passou; sem teste em aparelho | Parcial |
| Item 5 — cadastro/login | Cadastro técnico/oficina separado; login mobile retorna 500 | Sintaxe PHP corrigida em PR separado | b92837a / PR #3 | HTTP 500 reproduzido com login fictício; log confirmou linha 95; parser PHP 8.3 passou em 224 arquivos corrigidos | API NÃO publicada; preservar uploads antes |
| Item 8 — perfis | ADMIN cai em tela de perfil não disponível; DESMONTADOR sem área funcional; banco contém ADMIN, TECNICO, OFICINA | Ainda não implementado | — | Inspeção de rotas e agregados do banco | Pendente |
| Item 12 — Solicitar técnico | Código já aguarda ID persistido antes de Avançar; teste autenticado indisponível | Nenhuma nova alteração neste fluxo | — | Inspeção estática; falta criar/salvar/reabrir como oficina | Não homologado |
| Item 13 — perícias | Técnico exibia status em linha diferente de placa/modelo | Status movido para linha de placa/modelo; oficina já estava alinhada | Commit que contém este arquivo | TypeScript e bundles; visual em aparelho pendente | main; sem build assinado |
| Item 14 — valor manual | Técnico ainda exibia preço sugerido; listas não recuperavam valor de perícia simples | Texto unificado e fallback para preco_sugerido nas listas; contrato legado da API mantido | 0cabbb8 + commit que contém este arquivo | Compilação passou; salvar/reabrir autenticado pendente | Parcial |
| PDF CNPJ MARCOS | Registro localizado em tecnico_documentos; 59621 bytes; existência física não confirmada | Nenhuma alteração destrutiva; API já possui download autenticado | — | Banco consultado; abertura autenticada bloqueada por ausência de sessão | Pendente |
| Persistência | Logs da instância ativa: PUBLIC_UPLOADS_PATH não configurado; uploads efêmeros | Deploy da API retido para evitar perder arquivos atuais | — | Confirmado nos logs de 06/11 às 20:09 BRT | Requer backup e verificar disco; custo adicional exige autorização |
| Dashboard | Dados de referência consultados; implementação atual usa barras anuais, histórico solicita linhas mensais comparativas | Sem correção nesta rodada | — | SQL: nenhuma fatura elegível; totais anual/mês/semana = 0 em 06/11; interface autenticada não validada | Pendente |
| Usuários/documentos | CRUD, filtros e previews não exercitados com sessão | — | — | Somente inspeção de código e registro PDF | Pendente |
| Serviços | Teste automatizado existente disponível | — | — | npm run test:services passou; WEB build passou | Sem nova mudança WEB |
| Financeiro/comissões | Regras e CRUD não homologados | — | — | Checagem SQL de vínculos: nenhum órfão nas quatro relações verificadas | Pendente |
| Configurações | Sete abas existem; painéis estão vazios | Ainda não implementado | — | Inspeção do Settings.tsx | Pendente |
| Administradores/permissões | Acesso autenticado e permissões não testados | — | — | WEB abriu em /login, sem sessão | Pendente |
| Fotos/câmera/galeria/push/histórico | Testes nativos não executados | — | — | Bundle não comprova uso de recursos nativos | Pendente |
| Android/iOS | Versões anteriores 2.4/25; Xcode 1.0/1 divergente | Candidato 2.5/26 sincronizado entre Expo, Gradle, plist e Xcode | Commit que contém este arquivo | Bundles Android/iOS gerados; EAS whoami: Not logged in | Credenciais/certificados e último número publicado não verificados; nenhuma AAB/IPA assinada |

## Continuação necessária

1. Restabelecer a conexão ao navegador local com sessão administrativa.
2. Preservar uploads atuais e verificar disco persistente antes de integrar PR #3. Não basta adicionar variável sem disco real.
3. Autenticar EAS na conta com acesso a binotto-team; conferir numerações já usadas e credenciais antes de iniciar builds de produção.
4. Implementar áreas e permissões ADMIN/DESMONTADOR e configurações; concluir testes reais dos seis itens e demais módulos.
5. Publicar a API após preservação, repetir login e CRUD em produção, gerar builds assinados e testar em Android/iOS.
6. Enviar às lojas somente após autorização final de Lucas.

Validação PHP foi feita com php-parser (sintaxe 8.3), não com PHPUnit/PHP CLI, indisponível neste ambiente. Bundles são exportações JS/Hermes, não instaladores assinados. Render usa filtros por diretório: mudanças somente no APP não geram deploy WEB/API.
