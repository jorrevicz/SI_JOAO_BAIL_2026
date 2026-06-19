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
| Acesso a dados | **postgres.js** (driver SQL direto — sem ORM nem query builder) |
| Migrations & schema | **node-pg-migrate** (migrations SQL versionadas em `/Backend/src/db/migrations`) |
| Tipos do banco | **kanel** (introspecta o schema e gera interfaces TS em `/Backend/src/db/types`) |
| Seed | Script em `/Backend/src/db/seed.ts` (idempotente, `INSERT ... ON CONFLICT`) |
| Validação de entrada | **Zod v4** — `validate(schema)` middleware em `shared/validation` |

O **postgres.js** é a fronteira entre o domínio e o banco, na camada de repositórios. As
**migrations SQL** (node-pg-migrate) são a fonte de verdade do
[Modelo de Dados](06-modelo-de-dados.md); migrations e seed vivem em `/Backend/src/db`, e os
tipos das linhas são gerados pelo **kanel** a cada mudança de schema.

## Frontend (`/Frontend`)

| Aspecto | Ferramenta |
|---------|-----------|
| Biblioteca de UI | **React** |
| Build / dev server | **Vite** |
| Estilização | **styled-components** |
| Tabelas de dados | **TanStack Table** |
| Gerência de estado | **Context API** (React) |
| Roteamento | **React Router** |
| Cliente HTTP | **axios** |

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
- **postgres.js (sem ORM):** acesso a dados com SQL explícito, mantendo controle total
  sobre as consultas e respeitando as formas normais do banco. Os *tagged template
  literals* parametrizam automaticamente os valores (defesa contra SQL Injection — RNF05),
  e `sql.begin` provê transações atômicas com rollback (RNF06). Mais leve que um ORM e
  alinhado ao requisito de POO: as regras de negócio ficam nos *services*, e o
  repository apenas executa SQL.
- **node-pg-migrate para migrations:** o schema evolui por migrations **SQL versionadas**,
  que passam a ser a fonte de verdade do [Modelo de Dados](06-modelo-de-dados.md), dentro
  do ecossistema npm/CI. Substitui o `prisma migrate`.
- **kanel para tipos:** introspecta o banco e gera as interfaces TypeScript das tabelas —
  são **apenas tipos** (não é query builder), repondo a tipagem ponta-a-ponta que o
  cliente do ORM oferecia, sem acoplar o domínio a um ORM.
- **PostgreSQL local:** banco local (PostgreSQL 16) para acelerar o desenvolvimento
  backend-first sem depender de infraestrutura externa.
- **Zod v4 para validação:** integra com TypeScript nativamente; o middleware
  `validate(schema)` retorna 400 com mensagem em PT quando o payload falha — os
  schemas Zod por recurso são criados junto com cada CRUD (EP-04+), com os tamanhos de
  campo espelhando as colunas definidas nas migrations SQL. `z.infer` fornece os tipos
  dos DTOs de entrada.
- **styled-components:** cada componente encapsula seus próprios
  estilos no mesmo arquivo `style.js`/`style.ts`, eliminando colisões de classe e
  permitindo isolar visualmente cada peça sem depender de utilitários globais.
  O CSS-in-JS também facilita estilos dinâmicos baseados em props TypeScript.
- **TanStack Table:** biblioteca *headless* para tabelas de dados — não impõe marcação
  nem estilos próprios, entregando apenas a lógica (hooks). Isso permite estilizar
  completamente cada tabela com styled-components, mantendo coerência visual com o
  restante do sistema. As funcionalidades aproveitadas são:
  - **Paginação** — controle de página e tamanho de página no cliente (ou servidor).
  - **Ordenação** — clique no cabeçalho da coluna para ordenar ascendente/descendente.
  - **Filtragem** — filtros por coluna ou globais, aplicados sobre os dados locais.
- **Context API:** o escopo é pequeno; Context API atende ao
  gerenciamento de estado sem complexidade extra.
- **Vite + Vitest:** ferramental moderno e rápido, integrado ao ecossistema React/TS.

## Restrições de plataforma

- Compatibilidade com navegadores modernos: **Chrome, Edge, Firefox**.
- Telas **responsivas** (desktop e mobile) — ver
  [Requisitos não funcionais](04-requisitos.md#requisitos-não-funcionais).

## Documentos relacionados

- [Arquitetura](02-arquitetura.md) — onde cada ferramenta se encaixa nas camadas.
- [Requisitos](04-requisitos.md) — restrições que justificam parte das escolhas.
