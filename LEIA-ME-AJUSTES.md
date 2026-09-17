# BINOTTO — ajustes solicitados pelo Juliano — 17/09/2026

Base utilizada: `main` no commit `1670926eae76f6e1a7d4e443873d998f87cba961`.

## Implementado

- Serviços agora têm dois fluxos no painel: **Criar solicitação** e **Criar serviço**.
- Criar solicitação:
  - oficina permanece visível depois da seleção;
  - moeda removida da tela;
  - fluxo simplificado no padrão do app: oficina, período, unidade/quantidade e observações;
  - backend mantém EUR automaticamente.
- Criar serviço:
  - usa a mesma estrutura visual/campos da tela de serviço;
  - oficina, status, técnico, carro, 3D, preço e remuneração do técnico.
- Tela do serviço:
  - oficina editável;
  - status editável;
  - técnico editável;
  - placa, chassi e marca/modelo;
  - carro 3D preservado;
  - preço editável;
  - remuneração do técnico por valor fixo ou porcentagem;
  - contas a pagar e contas a receber removidas desta tela;
  - histórico e perícias vinculadas preservados.
- Correções:
  - valores `0` são preservados em atualização de perícia/serviço;
  - inputs bloqueiam propagação para atalhos globais, evitando interferência na tecla `0`, inclusive em senha;
  - SearchableSelect mantém o rótulo da oficina selecionada.
- Migration segura adiciona `percentual_tecnico` e cria `preco_tecnico` apenas se a base ainda não possuir essa coluna.
- Nenhum arquivo da pasta `app/` foi alterado ou incluído neste patch.
