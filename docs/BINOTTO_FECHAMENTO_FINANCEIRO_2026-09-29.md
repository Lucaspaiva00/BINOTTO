# Binotto — fechamento dos ajustes financeiros e integração (29/09/2026)

## Interface WEB
A área **Preço** da criação e edição de serviços contém três seções visuais: **Reparação**, **Desmontagem** e **Total**. As duas primeiras possuem, separadamente: valor/tipo da oficina; comissão/preço do técnico (percentual **com resultado em dinheiro ao lado** ou valor fixo); sugestão do técnico em dinheiro; permissões independentes para compartilhar com o outro perfil e para habilitar o preenchimento pelo próprio perfil. A seção Total soma os resultados calculados da reparação e desmontagem para oficina e técnico. Sugestões são informativas e **não entram nos totais**.

Na listagem, **Preço da oficina** mostra o valor monetário calculado (reparação + desmontagem) em vez de apresentar a porcentagem como se fosse dinheiro. Para serviços legados ainda sem valores detalhados completos, mantém o valor total legado em vez de inventar a desmontagem.

## Dados e permissões
O JSON `servicos.precos_detalhados` preserva as quatro chaves existentes (`oficina_carro`, `tecnico_carro`, `oficina_desmontagem`, `tecnico_desmontagem`) e acrescenta duas chaves **opcionais**, sem nova migração:
- `tecnico_sugestao_carro`: sugestão monetária para reparação.
- `tecnico_sugestao_desmontagem`: sugestão monetária para desmontagem.

Cada sugestão usa o mesmo contrato seguro `{ "tipo":"valor", "valor": 375, "visivel_app": false, "habilitado_preenchimento_app": false }`. A oficina só recebe sugestão do técnico quando `visivel_app=true`; o técnico só pode visualizar/preencher a própria sugestão quando `habilitado_preenchimento_app=true`. O administrador consulta e configura todos os valores. O servidor rejeita sugestões em percentual, valores inválidos e tentativas mobile não autorizadas.

O painel envia as seis entradas; a API continua aceitando **quatro entradas** para clientes anteriores, sem quebrar a edição dos serviços legados.

Os cálculos mantêm as duas direções:
- Oficina R$ 1.000 fixa + comissão técnico 30% = técnico R$ 300.
- Técnico R$ 400 fixo + participação oficina 40% = oficina R$ 1.000.
- Reparação e desmontagem possuem bases independentes. Totais são calculados pela soma de ambas, sem somar sugestões.

## APP: contrato incremental para o desenvolvedor
Os endpoints de preço criados anteriormente permanecem:
- `GET/PATCH /api/mobile/tecnico/servicos/{id}/precos`
- `GET/PATCH /api/mobile/oficina/servicos/{id}/precos`

O GET/PATCH também devolve `data.precos_totais` com `oficina` e `tecnico` em valores monetários ou `null` quando alguma parcela não pode ser mostrada. As duas novas entradas de sugestão aparecem em `data.precos_detalhados` **somente se permitidas para o perfil**.

O técnico pode enviar **sua própria sugestão** com:
```json
{"campo":"sugestao","item":"carro","valor":375}
```
Aceita também `item:"desmontagem"`. `tipo` não é necessário para a sugestão; a API força `tipo:"valor"`, exige `habilitado_preenchimento_app=true`, confere o vínculo do técnico ao serviço, não altera a comissão e não modifica os valores contratados. A oficina não pode enviar uma sugestão do técnico. As chamadas anteriores com `{"item":"carro","tipo":"valor","valor":400}` continuam compatíveis.

**O aplicativo mobile ainda precisa incorporar os novos campos e os totais e publicar uma nova versão pelo desenvolvedor do APP.** Modificar WEB + API não atualiza as telas do aplicativo já instalado.

## Status e validação
Os `ServicoStatusObserver` e `PericiaStatusObserver` existentes continuam interligando os status do serviço e de suas perícias, com mapeamento próprio para os diferentes ciclos de vida e proteção para múltiplas perícias. A mudança financeira não altera esses observadores.

Testes locais planejados:
- `php api/tests/manual/precos_mobile_smoke.php` (cálculo, confidencialidade, sugestões, total).
- `php api/tests/manual/sync_status_smoke.php` (18 cenários de mapeamento).

Homologação integrada indispensável após deploy: criar ou abrir serviço com oficina e técnico de teste; confirmar que **WEB → API → APP e APP → API → WEB** persistem preço, sugestão e visibilidade; alterar status de serviço e perícia e atualizar as duas telas; validar GET/PATCH por perfil e PDF. Os testes de mapeamento não substituem esta homologação em produção.
