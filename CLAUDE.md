# CLAUDE.md

Guia para o Claude Code ao trabalhar neste repositório. Leia antes de gerar ou alterar código.

## O que é este projeto

Sistema de gestão (ERP enxuto) para uma **empresa de informática pequena** com
operações informais — sem sistema prévio. Operações centrais: **cadastro, compra e venda**. Web API REST + SPA.


> **Estado atual:** apenas a base de conhecimento em [`docs/`](docs/README.md) existe.
> Ainda **não há código** — `Backend/` e `Frontend/` serão criados conforme o
> [Roadmap](docs/09-roadmap.md). Ao começar a implementar, siga a estrutura abaixo.

## Fonte de verdade: leia `docs/` primeiro

A especificação arquitetural está em [`docs/`](docs/README.md), separada por escopo.
**Antes de implementar qualquer módulo, consulte os documentos relevantes:**

- Entidades, atributos e operações → [docs/05-modelo-de-dominio.md](docs/05-modelo-de-dominio.md)
- Tabelas, PK/FK, normalização → [docs/06-modelo-de-dados.md](docs/06-modelo-de-dados.md)
- O que cada módulo faz e suas regras → [docs/07-casos-de-uso.md](docs/07-casos-de-uso.md)
- Requisitos (RF/RNF) → [docs/04-requisitos.md](docs/04-requisitos.md)
- Ordem de construção → [docs/09-roadmap.md](docs/09-roadmap.md)
- Termos fiscais (NCM/SH, CFOP, ICMS…) → [docs/10-glossario.md](docs/10-glossario.md)
- Princípios de engenharia complementares (o que adotar/dispensar) → [docs/12-principios-de-engenharia.md](docs/12-principios-de-engenharia.md)

Se uma alteração contradisser os `docs/`, **atualize os `docs/` junto** — eles devem
permanecer fiéis ao código.

## Stack

- **Linguagem:** TypeScript (backend e frontend).
- **Backend:** Node.js + Express; acesso a dados com **postgres.js** (driver SQL direto, sem ORM);
  migrations SQL com **node-pg-migrate**; tipos das tabelas gerados pelo **kanel**; validação **Zod v4**.
- **Frontend:** React + Vite; **styled-components** (CSS-in-JS, isolamento por componente); **TanStack Table** (tabelas headless com paginação, ordenação e filtragem); estado via **Context API**; **React Router**; cliente HTTP **axios**.
- **Testes:** **Vitest**.
- **Banco:** PostgreSQL (local: PostgreSQL 16).

Não introduza outras bibliotecas para o que a stack já cobre (ex.: não use Redux —
o estado é Context API; **não introduza ORM nem query builder** — o acesso a dados é SQL
direto via postgres.js; não use TailwindCSS — a estilização é styled-components; não use
AG Grid nem react-table diretamente — é TanStack Table). Detalhes e racional em
[docs/03-stack-tecnologica.md](docs/03-stack-tecnologica.md).

## Estrutura de diretórios

```
/Backend
  /src         → API: routes → controllers → services (domínio) → repositories (postgres.js)
    /lib       → instância compartilhada do cliente postgres.js (`sql`)
    /db        → camada de banco de dados
      /migrations → migrations SQL versionadas (node-pg-migrate)
      /types    → interfaces TS geradas pelo kanel (não editar à mão)
      seed.ts   → script de seed idempotente
/Frontend
  /src         → SPA React
    /assets    → arquivos estáticos
    /components → componentes reutilizáveis (index.tsx + style.js por componente)
    /hooks     → hooks customizados compartilhados
    /pages     → páginas por rota (index.tsx + style.js por página)
    /services  → clientes axios (um por domínio de API)
    /styles    → globalStyles.js (createGlobalStyle)
    /themes    → tokens de design (cores, tipografia, espaçamentos)
    /utils     → funções utilitárias puras
/docs          → base de conhecimento (NÃO é código; manter sincronizado)
```

Cada subdomínio do [modelo de domínio](docs/05-modelo-de-dominio.md)
(localização, parceiros, produtos, logística, financeiro, compras, fiscal, acesso)
vira um módulo no backend. Ver [docs/02-arquitetura.md](docs/02-arquitetura.md).

## Princípios obrigatórios

1. **POO** — modele o domínio em classes; mantenha regra de negócio nos *services*,
   fora de controllers e do transporte HTTP.
2. **Formas normais (até 3FN)** — relações N:N via tabelas associativas; sem colunas
   redundantes (ver pendências de normalização nos
   [docs de dados](docs/06-modelo-de-dados.md#princípios-de-modelagem)).
3. **REST** — recursos no plural, verbos HTTP semânticos, JSON. Padrão em
   [docs/02-arquitetura.md](docs/02-arquitetura.md#padrão-de-api-rest).
4. **Atomicidade** — compras, notas fiscais e contas rodam em transação com rollback
   via `withTransaction` (wrapper de `sql.begin` do postgres.js) — RNF06.
5. **Autenticação** — todo módulo exige usuário autenticado, exceto login/registro (RN001).
6. **Auditoria** — toda entidade tem `codUser`, `dtCriacao`, `dtEdicao`, `isActive`
   (soft delete); nunca apague registro com dependentes (RN002).
7. **Português** — mensagens de UI/erro, comentários e documentação em português.
8. **TDD** — ao criar ou modificar um *service* de backend, siga o ciclo
   Red → Green → Refactor:
   1. Escreva o teste (Vitest) que descreve o comportamento esperado — ele deve falhar.
   2. Implemente o mínimo de código no *service* para o teste passar.
   3. Refatore sem quebrar o teste.
   Testes de *service* são unitários (mockam o repositório); testes de rota são de
   integração (usam `supertest` contra a instância Express); testes de *repository* são de
   integração contra um banco de teste, cada um em transação revertida (rollback). Não
   avance para o próximo método/rota sem todos os testes anteriores passando.
9. **Acesso a dados seguro (postgres.js)** — SQL escrito à mão na camada de repositório:
   valores **sempre** por *tagged template* (`sql\`... ${valor}\``), nunca concatenados
   (defesa SQLi/RNF05); identificadores dinâmicos só por whitelist com `sql(coluna)`;
   consultas filtram `isActive = true` e "remoção" é soft delete; paginação por cursor
   sobre `codX` (sem `OFFSET`). Detalhes em
   [docs/02-arquitetura.md](docs/02-arquitetura.md#acesso-a-dados-postgresjs).

## Ordem de implementação (não pule etapas)

Conforme [docs/09-roadmap.md](docs/09-roadmap.md):

1. Banco primeiro (migrations SQL em formas normais via node-pg-migrate), depois **scripts de seed**.
2. **Backend-first por módulo** — ao concluir e testar o backend de um módulo/CRUD,
   construir imediatamente as telas do frontend correspondente antes de avançar para
   o próximo módulo. Não aguardar todo o backend estar pronto para iniciar o frontend.
3. CRUDs em **lotes de três**, começando pelos mais básicos
   (Países → Estados → Cidades, que são pré-requisito dos demais).
4. Dentro de cada CRUD, **consultas (GET/Read) primeiro**; só depois Create/Update/Delete.
5. Login e fluxos completos de compra/venda: **decisão adiada** — não implemente sem
   confirmar com o usuário.

## Convenções de nomenclatura

Os nomes oficiais de entidades/campos estão no
[modelo de domínio](docs/05-modelo-de-dominio.md). O diagrama original tem **erros de
grafia a corrigir na implementação** — use a forma correta:

| No diagrama | Use no código |
|-------------|---------------|
| `Forncedores` | `Fornecedores` |
| `Users.tenha` | `senha` |
| `adicionarProsutoNfe` | `adicionarProdutoNfe` |
| `cfoPfodNfe` | `cfopNfe` (CFOP) |
| `codUSer` | `codUser` |
| `adicionarPrdutoCategoria` | `adicionarProdutoCategoria` |

Identificadores de código (variáveis, funções, classes, métodos, rotas) são escritos em
**inglês**. Mensagens de UI/erro, campos do banco de dados, comentários e documentação permanecem em português.

## Camada de dados — postgres.js + node-pg-migrate + kanel

Sem ORM. A configuração da conexão e das ferramentas:
- **Conexão:** `DATABASE_URL` no `.env` (lido com `dotenv`). O cliente único `sql` vive em
  `Backend/src/lib/db.ts` (`postgres(process.env.DATABASE_URL, { ...opções })`), com pool
  enxuto, `idle_timeout`, `connect_timeout` e `statement_timeout` (apoia RNF02 ≤ 2s). O
  `server.ts` chama `sql.end()` no `SIGTERM`/`SIGINT` (shutdown gracioso).
- **Schema/migrations:** SQL versionado em `Backend/src/db/migrations/` via **node-pg-migrate**
  (`up`/`down`). É a **fonte de verdade** do banco (não há mais `schema.prisma`). Identificadores
  são *PascalCase entre aspas* (`"Paises"`, `"codPais"`), então o SQL precisa citá-los; o
  `dtEdicao` tem `DEFAULT CURRENT_TIMESTAMP` (não há mais `@updatedAt`).
- **Tipos:** **kanel** introspecta o banco e gera as interfaces TS das tabelas em
  `Backend/src/db/types/` — rode `npm run types:gen` após cada migration.
- **Transações:** `withTransaction(fn)` (`src/shared/transaction/withTransaction.ts`) envolve
  `sql.begin`; use-o em operações multi-tabela (compras, NF-e, contas) — RNF06.
- **Erros do Postgres:** o `errorHandler` mapeia códigos (`23505` unique, `23503` FK/RN002)
  para `AppError` com mensagem em português.
- **Banco local:** PostgreSQL 16 instalado via Homebrew, iniciado com
  `brew services start postgresql@16`. O banco `si_joao_bail_2026` já foi criado.

## Comandos

```bash
# Backend (em /Backend)
npm run dev            # sobe a API com tsx watch (hot-reload)
npm run build          # compila TypeScript → dist/
npm run typecheck      # npx tsc --noEmit (sem emitir arquivos)
npm test               # Vitest (run único)
npm run test:watch     # Vitest em modo watch
npm run lint           # ESLint em src/
npm run format         # Prettier em src/
npm run migrate        # node-pg-migrate up (aplica migrations SQL)
npm run migrate:down   # node-pg-migrate down (reverte a última migration)
npm run migrate:create # cria uma nova migration SQL
npm run types:gen      # kanel — regenera os tipos das tabelas após migrations
npm run seed           # tsx src/db/seed.ts (idempotente)

# Frontend (em /Frontend — EP-11, ainda não inicializado)
npm run dev            # Vite dev server
npm test               # Vitest
```

## Ao concluir uma tarefa

- Confirme que todos os testes passam (`npm test` em `/Backend`).
- Rode o type-check (`npm run typecheck`).
- Se mudou entidades, esquema ou regras, **atualize os `docs/` correspondentes**.
- Não commite nem faça push sem o usuário pedir.

## Commits e descrições de MR

- Mensagens de commit e descrições de MR/PR devem ser sempre em **português (pt_BR)**.
- Siga o padrão Conventional Commits em português: `tipo(escopo): descrição` — ex.: `feat(localização): adicionar CRUD de Países`.
