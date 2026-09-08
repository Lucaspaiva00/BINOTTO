# Modelos 3D de veículos

Coloque aqui somente arquivos `.glb` com licença comercial válida e com os
direitos de uso no sistema Binotto. Cada modelo deve ser registrado em
`src/constants/vehicleAssets.ts` com seu caminho e o mapeamento dos nomes das
malhas para as peças de perícia.

Exemplo:

```ts
{
  id: "fiat-argo",
  label: "Fiat Argo",
  assetPath: "/models/fiat-argo.glb",
  partNodes: {
    capo: ["hood", "capo"],
    porta_dianteira_esq: ["front_door_l"],
  },
}
```

O sistema continua exibindo o perfil técnico genérico até que o arquivo e o
mapeamento estejam cadastrados.
