<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descrição

API NestJS com Postgres, TypeORM, Redis, Swagger, Winston e JWT.

## Executando com Docker Compose

Pré-requisitos:
- Docker e Docker Compose instalados

Passo a passo (rodando a partir deste diretório `take-home-backend`):

```bash
# 1) Subir Postgres, Redis e Backend (compila, roda migrações e inicia)
docker compose up -d --build postgres redis backend

# 2) Ver logs do backend (opcional)
docker compose logs -f backend
```

URLs úteis:
- Swagger: http://localhost:3001/docs
- API: http://localhost:3001

Usuário seed (login inicial):
- email: admin@admin.com
- password: admin

## Variáveis de ambiente

As principais variáveis já estão no `docker-compose.yml`:
- DATABASE_URL: postgresql://appuser:apppass@postgres:5432/appdb
- REDIS_HOST: redis
- REDIS_PORT: 6379
- PORT: 3001
- NODE_ENV: production
- JWT_SECRET: change-me (defina em produção)
- JWT_EXPIRES_IN: 1h

## Executando localmente (sem Docker)

```bash
# 1) Subir apenas infra via Docker
docker compose up -d postgres redis

# 2) Instalar deps e rodar backend em dev
npm install
npm run start:dev
```

## Testes

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Observações
- Migrations rodam automaticamente no container do backend.
- Logs são gravados em `logs/app.log` e no console.
- Em produção, desabilite `autoLoadEntities`/`synchronize` (já está `false`) e use migrations.
