# Binotto Mobile

Aplicativo mobile do projeto Binotto (React Native + Expo + TypeScript).

## Requisitos

- Node.js LTS
- npm
- Expo Go no celular (Android/iOS)

## Setup rapido

1. Instalar dependencias:

```bash
npm install
```

2. Criar arquivo de ambiente local:

```bash
cp .env.example .env
```

3. Ajustar URL da API no `.env`:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:8000
```

Observacao:

- Em celular fisico, nao use `127.0.0.1`.
- Use o IP da maquina na mesma rede Wi-Fi.

4. Rodar o app:

```bash
npx expo start
```

Para limpar cache, se necessario:

```bash
npx expo start -c
```

## Fluxo de Git (Oficial)

Trabalharemos somente com a branch `main`.

- Nao usaremos mais a branch `homolog`.
- Toda nova tarefa deve criar branch a partir da `main`.
- Ao finalizar, abrir PR/merge da branch de tarefa para `main`.

### Exemplo de fluxo

```sh
git checkout main
git pull origin main
git checkout -b feat/nome-da-tarefa

# ...desenvolvimento...

git add .
git commit -m "feat: descricao da tarefa"
git push -u origin feat/nome-da-tarefa
```
