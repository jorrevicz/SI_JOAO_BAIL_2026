# 03 — Stack Tecnológica

Detalha as ferramentas concretas que materializam a [Arquitetura](02-arquitetura.md).

## Linguagem

- **TypeScript** em todo o projeto (backend e frontend).

## Backend (`/Backend`)

| Aspecto | Ferramenta |
|---------|-----------|
| Runtime | **Node.js** |
| Framework HTTP | **Express** |
| Banco de dados | **PostgreSQL** |
| ORM | **Prisma** (com *Local Prisma Postgres* para desenvolvimento) |
| Modelagem & seed | Scripts em `/Backend/DB` (schema Prisma + scripts de alimentação) |

O Prisma é a fronteira entre o domínio e o banco. O schema Prisma é a fonte de
verdade do [Modelo de Dados](06-modelo-de-dados.md); migrations e seeds vivem em
`/Backend/DB`.

## Frontend (`/Frontend`)

| Aspecto | Ferramenta |
|---------|-----------|
| Biblioteca de UI | **React** |
| Build / dev server | **Vite** |
| Estilização | **TailwindCSS** |
| Gerência de estado | **Context API** (React) |
| Roteamento | **React Router** |

## Testes

| Aspecto | Ferramenta |
|---------|-----------|
| Test runner | **Vitest** |

Aplica-se a backend e frontend (ambos em TypeScript). As **consultas** são as
primeiras candidatas a cobertura de testes, por serem implementadas primeiro
(ver [Roadmap](09-roadmap.md)).

## Decisões técnicas e racional

- **PERN + TypeScript end-to-end:** uma única linguagem reduz troca de contexto e
  permite compartilhar tipos entre camadas.
- **Prisma como ORM:** alinhado ao requisito de POO e de respeitar as formas normais
  — o schema declarativo torna o [Modelo de Dados](06-modelo-de-dados.md) explícito e
  versionável, e gera tipos TypeScript para o domínio.
- **Local Prisma Postgres:** banco local para acelerar o desenvolvimento
  backend-first sem depender de infraestrutura externa.
- **Context API (não Redux):** o escopo é pequeno; Context API atende ao
  gerenciamento de estado sem complexidade extra.
- **Vite + Vitest:** ferramental moderno e rápido, integrado ao ecossistema React/TS.

## Restrições de plataforma

- Compatibilidade com navegadores modernos: **Chrome, Edge, Firefox**.
- Telas **responsivas** (desktop e mobile) — ver
  [Requisitos não funcionais](04-requisitos.md#requisitos-não-funcionais).

## Documentos relacionados

- [Arquitetura](02-arquitetura.md) — onde cada ferramenta se encaixa nas camadas.
- [Requisitos](04-requisitos.md) — restrições que justificam parte das escolhas.
