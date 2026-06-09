# CLAUDE.md

Guia para o Claude Code ao trabalhar neste repositório. Leia antes de gerar ou alterar código.

## O que é este projeto

Sistema de gestão (ERP enxuto) para um **bazar de roupas** — empresa pequena sem
sistema. Operações centrais: **cadastro, compra e venda**. Web API REST + SPA.

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

Se uma alteração contradisser os `docs/`, **atualize os `docs/` junto** — eles devem
permanecer fiéis ao código.

## Stack

- **Linguagem:** TypeScript (backend e frontend).
- **Backend:** Node.js + Express; ORM **Prisma** + Local Prisma Postgres.
- **Frontend:** React + Vite; **TailwindCSS**; estado via **Context API**; **React Router**.
- **Testes:** **Vitest**.
- **Banco:** PostgreSQL.

Não introduza outras bibliotecas para o que a stack já cobre (ex.: não use Redux —
o estado é Context API; não use outro ORM — é Prisma). Detalhes e racional em
[docs/03-stack-tecnologica.md](docs/03-stack-tecnologica.md).

## Estrutura de diretórios

```
/Backend
  /DB          → schema Prisma, migrations, scripts de seed
  /src         → API: routes → controllers → services (domínio) → repositories (Prisma)
/Frontend
  /src         → SPA React
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
   (RNF06).
5. **Autenticação** — todo módulo exige usuário autenticado, exceto login/registro (RN001).
6. **Auditoria** — toda entidade tem `codUser`, `dtCriacao`, `dtEdicao`, `isActive`
   (soft delete); nunca apague registro com dependentes (RN002).
7. **Português** — mensagens de UI/erro, comentários e documentação em português.

## Ordem de implementação (não pule etapas)

Conforme [docs/09-roadmap.md](docs/09-roadmap.md):

1. Banco primeiro (schema Prisma em formas normais), depois **scripts de seed**.
2. **Backend antes do frontend.**
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

Escolha **um idioma** (PT ou EN) para identificadores de código e seja consistente no
módulo inteiro.

## Comandos

> Ainda não há `package.json`. Quando o projeto for inicializado, registre aqui os
> comandos reais (build, dev, test, migrate, seed). Padrão esperado:

```bash
# Backend (em /Backend)
npm run dev            # subir API em modo desenvolvimento
npx prisma migrate dev # aplicar migrations
npx prisma db seed     # popular o banco
npm test               # Vitest

# Frontend (em /Frontend)
npm run dev            # Vite dev server
npm test               # Vitest
```

## Ao concluir uma tarefa

- Rode os testes (Vitest) e o type-check do TypeScript.
- Se mudou entidades, esquema ou regras, **atualize os `docs/` correspondentes**.
- Não commite nem faça push sem o usuário pedir.
