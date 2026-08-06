# Binotto Backend API

## Stack

- PHP 8.2+
- Laravel 12
- PostgreSQL

## Principais libs

- `tymon/jwt-auth` — autenticação JWT
- `barryvdh/laravel-dompdf` — geração de PDF
- `google/auth`, `firebase/php-jwt` — login social (Google/Apple)
- `intervention/image-laravel` — manipulação de imagens
- `laravel/sanctum` — instalado (não é o guard padrão da API)

## Setup rápido

```bash
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate:fresh --seed
php artisan serve
```

## Ambiente de homologação

```bash
cp .env.homolog.example .env
php artisan key:generate
php artisan config:clear
php artisan migrate:fresh --force --seed
php artisan serve --host=0.0.0.0 --port=3333
```

## Dev completo (server + queue + logs + vite)

```bash
composer dev
```

## Testes e lint

```bash
php artisan test
php artisan test --filter=NomeDoTeste
vendor/bin/phpunit
vendor/bin/pint
```

## Fluxo de Git

Branch principal: `main`. Toda tarefa nova cria branch a partir da `main` e abre PR de volta para `main`.

```bash
git checkout main
git pull origin main
git checkout -b feat/nome-da-tarefa

# ...desenvolvimento...

git add .
git commit -m "feat: descricao da tarefa"
git push -u origin feat/nome-da-tarefa
```
