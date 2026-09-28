# Binotto — regras financeiras confirmadas pelo Juliano (APP + WEB)

**Base:** `main` anterior `26f2c3f`; esta entrega modifica apenas WEB e API. O desenvolvedor mobile deverá atualizar as telas usando o contrato abaixo. As flags ficam sob controle do administrador e são aplicadas no servidor, inclusive aos aliases legados e PDFs de serviços/perícias vinculadas.

## Cálculo por item, nos dois sentidos

`servicos.precos_detalhados` mantém **quatro entradas independentes**, agrupadas por item (carro ou desmontagem) e perfil (oficina ou técnico):

```json
{
  "oficina_carro":       {"tipo":"valor","valor":1000,"visivel_app":false,"habilitado_preenchimento_app":true},
  "tecnico_carro":       {"tipo":"porcentagem","valor":30,"visivel_app":false,"habilitado_preenchimento_app":true},
  "oficina_desmontagem": {"tipo":"porcentagem","valor":40,"visivel_app":false,"habilitado_preenchimento_app":true},
  "tecnico_desmontagem": {"tipo":"valor","valor":400,"visivel_app":false,"habilitado_preenchimento_app":true}
}
```

No exemplo, para o **carro**, a oficina cobra 1.000 e o técnico recebe 30% = **300**. Para **desmontagem**, o técnico informa 400, que representam 40% da oficina: cálculo inverso, **oficina = 1.000**. A API fornece os resultados derivados separadamente em `precos_calculados` e o painel em `calculatedPrices`, sem alterar os quatro dados digitados.

Combinações: oficina valor + técnico porcentagem; técnico valor + oficina porcentagem; ambos valor fixo independentes. Ambos em porcentagem, valor negativo, percentual >100% e inversão com percentual zero são **rejeitados**. Cada campo deve permanecer em sua unidade; o valor monetário calculado tem duas casas decimais.

## Dois controles independentes por preço

- **Ocultar preço no APP do outro perfil:** `visivel_app=false`. Se for um preço da **oficina**, impede que o **técnico** o veja. Se for um preço do **técnico**, impede que a **oficina** o veja. A API elimina esses preços **e seus valores calculados** das respostas do outro perfil.
- **Visualização e preenchimento no APP do próprio perfil:** `habilitado_preenchimento_app=true`. Quando desativada, a API oculta o campo para o próprio perfil e bloqueia **tentativas de gravação**, mesmo que um cliente antigo ou modificado envie uma chamada manual. Quando ativada, o próprio perfil pode visualizar e alterar apenas o **tipo e valor** do seu item, nunca permissões nem preços do outro perfil.

Por padrão, dados antigos sem `habilitado_preenchimento_app` assumem `false`. A versão anterior usava `visivel_app` do técnico com outro significado; flags legadas do técnico **não** são convertidas em permissão de leitura para a oficina.

**Admin** sempre vê todos os campos originais e calculados. Estes controles não criam automaticamente faturamento, contas a pagar ou recebíveis: são valores de cotação/configuração.

## Contrato APP atualizado

A API permanece em `https://binotto-api.onrender.com/api/mobile` e as rotas exigem sessão autorizada e o vínculo com a oficina ou o técnico correspondente.

| Perfil | Consultar campos liberados | Preencher campo liberado |
|---|---|---|
| Técnico | `GET /tecnico/servicos/{id}/precos` | `PATCH /tecnico/servicos/{id}/precos` |
| Oficina | `GET /oficina/servicos/{id}/precos` | `PATCH /oficina/servicos/{id}/precos` |

**PATCH JSON** (somente do próprio perfil):

```json
{"item":"carro","tipo":"valor","valor":400}
```

Também aceita `item:"desmontagem"`. A rota não aceita alteração de flags nem preços de outro perfil, consulta com vínculo inadequado recebe 404 e alteração desabilitada recebe 422. A API grava no JSON e sincroniza `valor_total`, `preco_tecnico`, `percentual_tecnico` e `primeiro_veiculo.preco_total` apenas quando houver base calculável. Os valores da **desmontagem** continuam exclusivamente no JSON próprio, sem somar indevidamente ao preço do carro.

**GET/PATCH de resposta**:

```json
{
  "success": true,
  "data": {
    "servico_id": 123,
    "moeda": "EUR",
    "precos_detalhados": {"oficina_carro": null, "tecnico_carro": {"tipo":"valor","valor":400,"visivel_app":false,"habilitado_preenchimento_app":true}},
    "precos_calculados": {"carro":{"oficina":null,"tecnico":400},"desmontagem":{"oficina":null,"tecnico":null}}
  }
}
```

Os dados da resposta ilustram apenas os campos de carro visíveis a um técnico; a resposta real inclui também as entradas de desmontagem (com valor ou `null` conforme as permissões). O APP não deve representar campo `null` como `0` nem renderizar entrada de edição sem `habilitado_preenchimento_app=true`.

As respostas legadas de `Servico` e `Pericia` continuam disponíveis, porém são sanitizadas para impedir que preços ocultos reapareçam nos campos de compatibilidade; em novos serviços configurados, clientes que dependiam de ler valores agora ocultos precisam se adaptar.

## Implantação e homologação

1. Efetuar backup e **confirmar que as migrations do release anterior foram aplicadas** (`2026_09_28_210000_service_details_and_status.php` cria `precos_detalhados`). Esta entrega acrescenta propriedades dentro do JSON existente, **sem nova migration**.
2. Publicar a API **antes** da WEB, porque o painel começa a enviar `habilitado_preenchimento_app` e os cálculos dependem do backend atualizado.
3. Testar os dois cálculos nos **dois itens**, com zero, limites e arredondamento; confirmar que a alteração do APP é refletida ao recarregar o painel e vice-versa.
4. Testar com login de oficina e técnico: preço oculto não pode aparecer em GET, retornos de PATCH, informações do serviço/perícia **nem PDF**; tentativa de gravar campo próprio desabilitado deve retornar 422; vínculo inválido deve retornar 404.
5. O código do APP não foi modificado. O desenvolvedor mobile deve acrescentar os novos campos/controles e atualizar as consultas após mutações.

**Validação local:** `php api/tests/manual/precos_mobile_smoke.php` e `php api/tests/manual/sync_status_smoke.php`. O build integrado e o teste contra o banco e os logins da produção devem ocorrer antes da homologação final.
