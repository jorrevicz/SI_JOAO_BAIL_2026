# EP-13 — Plano de Implementação: Migração Prisma → postgres.js + node-pg-migrate + kanel

## Contexto

A camada de dados foi construída sobre Prisma (EP-00 a EP-03) como scaffolding rápido.
A arquitetura definitiva usa **postgres.js** (SQL direto, sem ORM), **node-pg-migrate**
(migrations SQL versionadas) e **kanel** (tipos TypeScript gerados por introspecção).
A transição deve ocorrer **agora**, antes do EP-04, pois nenhum CRUD foi construído ainda
— só o módulo `health` existe, sem acesso ao banco.

**Estado atual:**
- `Backend/src/lib/prisma.ts` exporta `PrismaClient`
- `Backend/src/shared/transaction/withTransaction.ts` usa `prisma.$transaction`
- `Backend/DB/seed.ts` usa Prisma `upsert()`/`create()`
- `Backend/DB/migrations/` tem 2 migrations no formato Prisma
- `package.json` tem os scripts `migrate` e `seed` apontando para Prisma

**Estado alvo:**
- `Backend/src/lib/db.ts` exporta singleton `sql` (postgres.js)
- `withTransaction.ts` usa `sql.begin`
- `DB/seed.ts` usa `INSERT ... ON CONFLICT`
- `DB/migrations/` tem migration baseline no formato node-pg-migrate
- Tipos gerados em `Backend/src/db/` via kanel

---

## T-130 — Dependências e Scripts

### Passo 1 — Desinstalar pacotes Prisma (mesmo que não estejam em package.json)

```bash
cd Backend
npm uninstall @prisma/client @prisma/adapter-pg prisma 2>/dev/null || true
```

Remove também o diretório gerado pelo Prisma (se existir):
```bash
rm -rf node_modules/.prisma
```

### Passo 2 — Instalar novos pacotes de produção

```bash
npm install postgres
```

### Passo 3 — Instalar novos pacotes de desenvolvimento

```bash
npm install --save-dev node-pg-migrate kanel kanel-zod dotenv-cli
```

> `dotenv-cli` carrega o `.env` ao rodar scripts de CLI (node-pg-migrate, kanel)
> sem precisar configurar cada ferramenta separadamente.

### Passo 4 — Editar `Backend/package.json`

Substituir o conteúdo do arquivo para:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev":           "tsx watch src/server.ts",
    "build":         "tsc",
    "typecheck":     "tsc --noEmit",
    "test":          "vitest run",
    "test:watch":    "vitest",
    "lint":          "eslint src",
    "format":        "prettier --write src",
    "migrate":       "dotenv -e .env -- node-pg-migrate up",
    "migrate:down":  "dotenv -e .env -- node-pg-migrate down 1",
    "migrate:create":"dotenv -e .env -- node-pg-migrate create",
    "types:gen":     "dotenv -e .env -- kanel",
    "seed":          "dotenv -e .env -- tsx DB/seed.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "devDependencies": {
    "@eslint/js":           "^10.0.1",
    "@types/cors":          "^2.8.19",
    "@types/express":       "^5.0.6",
    "@types/node":          "^25.9.2",
    "@types/supertest":     "^7.2.0",
    "dotenv-cli":           "^8.0.0",
    "eslint":               "^10.4.1",
    "eslint-config-prettier":"^10.1.8",
    "kanel":                "^3.4.1",
    "kanel-zod":            "^0.11.0",
    "node-pg-migrate":      "^8.0.0",
    "prettier":             "^3.8.4",
    "supertest":            "^7.2.2",
    "tsx":                  "^4.22.4",
    "typescript":           "^6.0.3",
    "typescript-eslint":    "^8.61.0",
    "vitest":               "^4.1.8"
  },
  "dependencies": {
    "cors":    "^2.8.6",
    "dotenv":  "^17.4.2",
    "express": "^5.2.1",
    "postgres": "^3.4.5",
    "zod":     "^4.4.3"
  }
}
```

> **Nota:** `pg` e `@types/pg` foram removidos — eram usados apenas pelo `@prisma/adapter-pg`.
> O `postgres.js` tem seu próprio driver nativo, não depende de `pg`.

### Passo 5 — Deletar `Backend/prisma.config.ts`

```bash
rm Backend/prisma.config.ts
```

### Passo 6 — Criar `Backend/database.json` (config do node-pg-migrate)

```json
{
  "dir": "DB/migrations",
  "databaseUrlVar": "DATABASE_URL",
  "ignorePattern": "^\\..+"
}
```

> `dir` = onde ficam as migrations; `databaseUrlVar` = nome da variável de ambiente.

### Aceite T-130
- `npm install` roda sem erros
- `npm run` lista todos os scripts acima
- Nenhum pacote `@prisma/*` em `node_modules`

---

## T-131 — Cliente postgres.js compartilhado

### Passo 1 — Criar `Backend/src/lib/db.ts`

```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 5,
  idle_timeout: 20,    // segundos sem uso → fecha conexão
  connect_timeout: 10, // segundos máximo para conectar
  connection: {
    statement_timeout: 30_000, // 30s máximo por query (cobre RNF02 com margem)
  },
});

export default sql;
```

### Passo 2 — Deletar `Backend/src/lib/prisma.ts`

```bash
rm Backend/src/lib/prisma.ts
```

### Passo 3 — Atualizar `Backend/src/server.ts`

Substituir o conteúdo atual por:

```typescript
import 'dotenv/config';
import app from './app';
import sql from './lib/db';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em localhost:${PORT}`);
});

const shutdown = async () => {
  await sql.end({ timeout: 5 });
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

> O `import 'dotenv/config'` garante que o `.env` seja carregado antes de qualquer
> outro import (incluindo `db.ts` que lê `DATABASE_URL`). Necessário apenas no
> entry-point — não repetir em outros arquivos.

### Passo 4 — Verificar que app.ts NÃO importa dotenv

Se `Backend/src/app.ts` tiver `import 'dotenv/config'` ou `dotenv.config()`, remover
(carregamento duplicado é inofensivo mas desnecessário — server.ts já garante).

### Passo 5 — Testar

```bash
cd Backend && npm run dev
# Em outro terminal:
curl http://localhost:5000/health
# Esperado: {"status":"ok"} ou similar
```

### Aceite T-131
- `GET /health` responde 200
- Log "Servidor rodando em localhost:5000" aparece
- Ctrl+C finaliza sem erros (sql.end drena conexões)

---

## T-132 — Wrapper de transação via `sql.begin`

### Passo 1 — Reescrever `Backend/src/shared/transaction/withTransaction.ts`

```typescript
import type postgres from 'postgres';
import sql from '../../lib/db';

export async function withTransaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(fn);
}
```

> O tipo `postgres.TransactionSql` é o handle transacional que postgres.js passa ao
> callback de `sql.begin`. Qualquer erro lançado dentro do callback dispara `ROLLBACK`
> automático antes de re-propagar a exceção.

### Passo 2 — Reescrever `Backend/src/__tests__/withTransaction.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/db', () => ({
  default: {
    begin: vi.fn(),
  },
}));

import sql from '../lib/db';
import { withTransaction } from '../shared/transaction/withTransaction';

const mockSql = sql as unknown as { begin: ReturnType<typeof vi.fn> };

describe('withTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('executa a função dentro de uma transação e retorna o resultado', async () => {
    mockSql.begin.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );
    const fn = vi.fn().mockResolvedValue('resultado');

    const result = await withTransaction(fn);

    expect(mockSql.begin).toHaveBeenCalledOnce();
    expect(result).toBe('resultado');
  });

  it('propaga o erro quando a função falha (rollback)', async () => {
    mockSql.begin.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) => fn({}),
    );
    const fn = vi.fn().mockRejectedValue(new Error('falha na transação'));

    await expect(withTransaction(fn)).rejects.toThrow('falha na transação');
  });
});
```

### Passo 3 — Rodar testes

```bash
cd Backend && npm test
```

Todos os 5 arquivos de teste devem passar (health, authMiddleware, errorHandler,
validate, withTransaction).

### Aceite T-132
- `npm test` passa sem erros
- Os dois cenários de withTransaction (sucesso e rollback) passam

---

## T-133 — Migration baseline (node-pg-migrate)

### Passo 1 — Arquivar migrations do Prisma

```bash
mv Backend/DB/migrations Backend/DB/migrations-prisma
mkdir Backend/DB/migrations
```

> As migrations do Prisma ficam em `migrations-prisma/` para referência histórica.
> O `.gitignore` pode ignorá-las ou mantê-las — não afetam o novo fluxo.

### Passo 2 — Criar a migration baseline

Criar o arquivo `Backend/DB/migrations/1_baseline.js` com o conteúdo abaixo.

O DDL foi extraído das migrations do Prisma com duas modificações:
1. `"dtEdicao"` recebe `DEFAULT CURRENT_TIMESTAMP` (Prisma gerava via `@updatedAt`, agora é responsabilidade do banco e do repositório)
2. `"estado" VARCHAR(22)` (já incorpora o fix da segunda migration do Prisma)

```js
'use strict';

exports.up = (pgm) => {
  pgm.sql(`
    -- Users
    CREATE TABLE "Users" (
      "codUser"   SERIAL         NOT NULL,
      "nome"      VARCHAR(128)   NOT NULL,
      "email"     VARCHAR(150)   NOT NULL,
      "senha"     VARCHAR(255)   NOT NULL,
      "perfil"    VARCHAR(32)    NOT NULL DEFAULT 'operador',
      "dtCriacao" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"   INTEGER,
      "isActive"  BOOLEAN        NOT NULL DEFAULT true,
      CONSTRAINT "Users_pkey" PRIMARY KEY ("codUser")
    );
    CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

    -- Paises
    CREATE TABLE "Paises" (
      "codPais"   SERIAL        NOT NULL,
      "pais"      VARCHAR(60)   NOT NULL,
      "sigla"     VARCHAR(3)    NOT NULL,
      "ddi"       VARCHAR(5),
      "moeda"     VARCHAR(6),
      "dtCriacao" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"   INTEGER,
      "isActive"  BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Paises_pkey" PRIMARY KEY ("codPais")
    );
    CREATE UNIQUE INDEX "Paises_sigla_key" ON "Paises"("sigla");

    -- Estados
    CREATE TABLE "Estados" (
      "codEstado" SERIAL        NOT NULL,
      "uf"        VARCHAR(2)    NOT NULL,
      "estado"    VARCHAR(22)   NOT NULL,
      "codPais"   INTEGER       NOT NULL,
      "dtCriacao" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"   INTEGER,
      "isActive"  BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Estados_pkey" PRIMARY KEY ("codEstado")
    );
    CREATE INDEX "Estados_codPais_idx" ON "Estados"("codPais");
    ALTER TABLE "Estados"
      ADD CONSTRAINT "Estados_codPais_fkey"
      FOREIGN KEY ("codPais") REFERENCES "Paises"("codPais")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Cidades
    CREATE TABLE "Cidades" (
      "codCidade" SERIAL        NOT NULL,
      "cidade"    VARCHAR(32)   NOT NULL,
      "ddd"       VARCHAR(3),
      "codEstado" INTEGER       NOT NULL,
      "dtCriacao" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"   INTEGER,
      "isActive"  BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Cidades_pkey" PRIMARY KEY ("codCidade")
    );
    CREATE INDEX "Cidades_codEstado_idx" ON "Cidades"("codEstado");
    ALTER TABLE "Cidades"
      ADD CONSTRAINT "Cidades_codEstado_fkey"
      FOREIGN KEY ("codEstado") REFERENCES "Estados"("codEstado")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Fornecedores
    CREATE TABLE "Fornecedores" (
      "codForn"       SERIAL        NOT NULL,
      "nomeForn"      VARCHAR(128)  NOT NULL,
      "fantasiaForn"  VARCHAR(128),
      "cpfCnpjForn"   VARCHAR(14),
      "ieForn"        VARCHAR(20),
      "emailForn"     VARCHAR(150),
      "foneForn"      VARCHAR(15),
      "logradouroForn"VARCHAR(150),
      "numForn"       VARCHAR(10),
      "compForn"      VARCHAR(50),
      "bairroForn"    VARCHAR(60),
      "cepForn"       VARCHAR(8),
      "codCidade"     INTEGER       NOT NULL,
      "dtCriacao"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Fornecedores_pkey" PRIMARY KEY ("codForn")
    );
    CREATE INDEX "Fornecedores_codCidade_idx" ON "Fornecedores"("codCidade");
    ALTER TABLE "Fornecedores"
      ADD CONSTRAINT "Fornecedores_codCidade_fkey"
      FOREIGN KEY ("codCidade") REFERENCES "Cidades"("codCidade")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- CondicaoDePagamento (antes de Clientes, que tem FK para ela)
    CREATE TABLE "CondicaoDePagamento" (
      "codCondDePag"  SERIAL         NOT NULL,
      "condicao"      VARCHAR(60)    NOT NULL,
      "juros"         DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
      "multa"         DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
      "desconto"      DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
      "dtCriacao"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN        NOT NULL DEFAULT true,
      CONSTRAINT "CondicaoDePagamento_pkey" PRIMARY KEY ("codCondDePag")
    );

    -- Clientes
    CREATE TABLE "Clientes" (
      "codCliente"       SERIAL        NOT NULL,
      "nomeCl"           VARCHAR(128)  NOT NULL,
      "fantasiaCl"       VARCHAR(128),
      "cpfCnpjCl"        VARCHAR(14),
      "ieCl"             VARCHAR(20),
      "emailCl"          VARCHAR(150),
      "foneCl"           VARCHAR(15),
      "logradouroCl"     VARCHAR(150),
      "numCl"            VARCHAR(10),
      "compCl"           VARCHAR(50),
      "bairroCl"         VARCHAR(60),
      "cepCl"            VARCHAR(8),
      "codCidade"        INTEGER       NOT NULL,
      "codCondDePag"     INTEGER,
      "dtCriacao"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"          INTEGER,
      "isActive"         BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Clientes_pkey" PRIMARY KEY ("codCliente")
    );
    CREATE INDEX "Clientes_codCidade_idx"    ON "Clientes"("codCidade");
    CREATE INDEX "Clientes_codCondDePag_idx" ON "Clientes"("codCondDePag");
    ALTER TABLE "Clientes"
      ADD CONSTRAINT "Clientes_codCidade_fkey"
      FOREIGN KEY ("codCidade") REFERENCES "Cidades"("codCidade")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Clientes"
      ADD CONSTRAINT "Clientes_codCondDePag_fkey"
      FOREIGN KEY ("codCondDePag") REFERENCES "CondicaoDePagamento"("codCondDePag")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Veiculos (antes de Transportadoras, que tem FK para Veiculos)
    CREATE TABLE "Veiculos" (
      "codVeiculo"  SERIAL        NOT NULL,
      "placa"       VARCHAR(8)    NOT NULL,
      "modelo"      VARCHAR(60),
      "marca"       VARCHAR(60),
      "codEstado"   INTEGER       NOT NULL,
      "dtCriacao"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"     INTEGER,
      "isActive"    BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Veiculos_pkey" PRIMARY KEY ("codVeiculo")
    );
    CREATE INDEX "Veiculos_codEstado_idx" ON "Veiculos"("codEstado");
    ALTER TABLE "Veiculos"
      ADD CONSTRAINT "Veiculos_codEstado_fkey"
      FOREIGN KEY ("codEstado") REFERENCES "Estados"("codEstado")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Transportadoras
    CREATE TABLE "Transportadoras" (
      "codTransp"       SERIAL        NOT NULL,
      "nomeTransp"      VARCHAR(128)  NOT NULL,
      "fantasiaTransp"  VARCHAR(128),
      "cpfCnpjTransp"   VARCHAR(14),
      "ieTransp"        VARCHAR(20),
      "emailTransp"     VARCHAR(150),
      "foneTransp"      VARCHAR(15),
      "logradouroTransp"VARCHAR(150),
      "numTransp"       VARCHAR(10),
      "compTransp"      VARCHAR(50),
      "bairroTransp"    VARCHAR(60),
      "cepTransp"       VARCHAR(8),
      "codCidade"       INTEGER       NOT NULL,
      "dtCriacao"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      "isActive"        BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Transportadoras_pkey" PRIMARY KEY ("codTransp")
    );
    CREATE INDEX "Transportadoras_codCidade_idx" ON "Transportadoras"("codCidade");
    ALTER TABLE "Transportadoras"
      ADD CONSTRAINT "Transportadoras_codCidade_fkey"
      FOREIGN KEY ("codCidade") REFERENCES "Cidades"("codCidade")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Categorias
    CREATE TABLE "Categorias" (
      "codCategoria"  SERIAL        NOT NULL,
      "categoria"     VARCHAR(60)   NOT NULL,
      "dtCriacao"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Categorias_pkey" PRIMARY KEY ("codCategoria")
    );

    -- Produtos
    CREATE TABLE "Produtos" (
      "codProd"         SERIAL         NOT NULL,
      "nomeProd"        VARCHAR(128)   NOT NULL,
      "descProd"        VARCHAR(500),
      "unidMedProd"     VARCHAR(10)    NOT NULL DEFAULT 'UN',
      "pesoBrutoProd"   DECIMAL(10,3)  NOT NULL DEFAULT 0.000,
      "pesoLiqProd"     DECIMAL(10,3)  NOT NULL DEFAULT 0.000,
      "saldoProd"       DECIMAL(10,3)  NOT NULL DEFAULT 0.000,
      "custoMedioProd"  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "codCategoria"    INTEGER,
      "dtCriacao"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      "isActive"        BOOLEAN        NOT NULL DEFAULT true,
      CONSTRAINT "Produtos_pkey" PRIMARY KEY ("codProd")
    );
    CREATE INDEX "Produtos_codCategoria_idx" ON "Produtos"("codCategoria");
    ALTER TABLE "Produtos"
      ADD CONSTRAINT "Produtos_codCategoria_fkey"
      FOREIGN KEY ("codCategoria") REFERENCES "Categorias"("codCategoria")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- ProdutoFornecedor (N:N)
    CREATE TABLE "ProdutoFornecedor" (
      "codProd"   INTEGER  NOT NULL,
      "codForn"   INTEGER  NOT NULL,
      "dtCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"   INTEGER,
      CONSTRAINT "ProdutoFornecedor_pkey" PRIMARY KEY ("codProd","codForn")
    );
    ALTER TABLE "ProdutoFornecedor"
      ADD CONSTRAINT "ProdutoFornecedor_codProd_fkey"
      FOREIGN KEY ("codProd") REFERENCES "Produtos"("codProd")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ProdutoFornecedor"
      ADD CONSTRAINT "ProdutoFornecedor_codForn_fkey"
      FOREIGN KEY ("codForn") REFERENCES "Fornecedores"("codForn")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- ProdutoCategoria (N:N)
    CREATE TABLE "ProdutoCategoria" (
      "codProduto"    INTEGER  NOT NULL,
      "codCategoria"  INTEGER  NOT NULL,
      "dtCriacao"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      CONSTRAINT "ProdutoCategoria_pkey" PRIMARY KEY ("codProduto","codCategoria")
    );
    ALTER TABLE "ProdutoCategoria"
      ADD CONSTRAINT "ProdutoCategoria_codProduto_fkey"
      FOREIGN KEY ("codProduto") REFERENCES "Produtos"("codProd")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ProdutoCategoria"
      ADD CONSTRAINT "ProdutoCategoria_codCategoria_fkey"
      FOREIGN KEY ("codCategoria") REFERENCES "Categorias"("codCategoria")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- FormaDePagamento
    CREATE TABLE "FormaDePagamento" (
      "codFormaDePag" SERIAL        NOT NULL,
      "formaDePag"    VARCHAR(60)   NOT NULL,
      "dtCriacao"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "FormaDePagamento_pkey" PRIMARY KEY ("codFormaDePag")
    );

    -- Parcelas
    CREATE TABLE "Parcelas" (
      "codParcela"    SERIAL        NOT NULL,
      "numParcelas"   INTEGER       NOT NULL DEFAULT 1,
      "intervalo"     INTEGER       NOT NULL DEFAULT 30,
      "codCondDePag"  INTEGER       NOT NULL,
      "codFormaDePag" INTEGER       NOT NULL,
      "dtCriacao"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Parcelas_pkey" PRIMARY KEY ("codParcela")
    );
    CREATE INDEX "Parcelas_codCondDePag_idx"  ON "Parcelas"("codCondDePag");
    CREATE INDEX "Parcelas_codFormaDePag_idx" ON "Parcelas"("codFormaDePag");
    ALTER TABLE "Parcelas"
      ADD CONSTRAINT "Parcelas_codCondDePag_fkey"
      FOREIGN KEY ("codCondDePag") REFERENCES "CondicaoDePagamento"("codCondDePag")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Parcelas"
      ADD CONSTRAINT "Parcelas_codFormaDePag_fkey"
      FOREIGN KEY ("codFormaDePag") REFERENCES "FormaDePagamento"("codFormaDePag")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- NotasFiscaisEletronicas
    CREATE TABLE "NotasFiscaisEletronicas" (
      "codNfe"          SERIAL          NOT NULL,
      "chaveAcessoNfe"  CHAR(44)        NOT NULL,
      "numNfe"          INTEGER         NOT NULL,
      "serieNfe"        VARCHAR(3)      NOT NULL DEFAULT '001',
      "cfopNfe"         VARCHAR(4),
      "naturezaOpNfe"   VARCHAR(60),
      "totalProdNfe"    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "totalNfe"        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "baseCalcIcmsNfe" DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "valorIcmsNfe"    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "baseCalcIpiNfe"  DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "valorIpiNfe"     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
      "dtEmissaoNfe"    TIMESTAMP(3),
      "infoComplNfe"    VARCHAR(2000),
      "dtCriacao"       TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"        TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      "isActive"        BOOLEAN         NOT NULL DEFAULT true,
      CONSTRAINT "NotasFiscaisEletronicas_pkey" PRIMARY KEY ("codNfe")
    );
    CREATE UNIQUE INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key"
      ON "NotasFiscaisEletronicas"("chaveAcessoNfe");

    -- VeiculoNfe (N:N)
    CREATE TABLE "VeiculoNfe" (
      "codNfe"      INTEGER  NOT NULL,
      "codVeiculo"  INTEGER  NOT NULL,
      "codForn"     INTEGER,
      "dtCriacao"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"     INTEGER,
      CONSTRAINT "VeiculoNfe_pkey" PRIMARY KEY ("codNfe","codVeiculo")
    );
    ALTER TABLE "VeiculoNfe"
      ADD CONSTRAINT "VeiculoNfe_codNfe_fkey"
      FOREIGN KEY ("codNfe") REFERENCES "NotasFiscaisEletronicas"("codNfe")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "VeiculoNfe"
      ADD CONSTRAINT "VeiculoNfe_codVeiculo_fkey"
      FOREIGN KEY ("codVeiculo") REFERENCES "Veiculos"("codVeiculo")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "VeiculoNfe"
      ADD CONSTRAINT "VeiculoNfe_codForn_fkey"
      FOREIGN KEY ("codForn") REFERENCES "Fornecedores"("codForn")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- ProdutoNfe (N:N com dados fiscais por item)
    CREATE TABLE "ProdutoNfe" (
      "codNfe"          INTEGER        NOT NULL,
      "codProduto"      INTEGER        NOT NULL,
      "qtdProdNfe"      DECIMAL(10,3)  NOT NULL DEFAULT 0.000,
      "vlrUnitProdNfe"  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "vlrTotalProdNfe" DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "baseCalcIcmsNfe" DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "aliqIcmsNfe"     DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
      "vlrIcmsNfe"      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "baseCalcIpiNfe"  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "aliqIpiNfe"      DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
      "vlrIpiNfe"       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "dtCriacao"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      CONSTRAINT "ProdutoNfe_pkey" PRIMARY KEY ("codNfe","codProduto")
    );
    ALTER TABLE "ProdutoNfe"
      ADD CONSTRAINT "ProdutoNfe_codNfe_fkey"
      FOREIGN KEY ("codNfe") REFERENCES "NotasFiscaisEletronicas"("codNfe")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ProdutoNfe"
      ADD CONSTRAINT "ProdutoNfe_codProduto_fkey"
      FOREIGN KEY ("codProduto") REFERENCES "Produtos"("codProd")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- ContasAPagar
    CREATE TABLE "ContasAPagar" (
      "codContasAPag"   SERIAL         NOT NULL,
      "descricao"       VARCHAR(128),
      "vlrContasAPag"   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "dtVencimento"    TIMESTAMP(3),
      "dtPagamento"     TIMESTAMP(3),
      "status"          VARCHAR(20)    NOT NULL DEFAULT 'aberta',
      "codNfe"          INTEGER,
      "codForn"         INTEGER        NOT NULL,
      "codParcela"      INTEGER,
      "dtCriacao"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      "isActive"        BOOLEAN        NOT NULL DEFAULT true,
      CONSTRAINT "ContasAPagar_pkey" PRIMARY KEY ("codContasAPag")
    );
    CREATE INDEX "ContasAPagar_codNfe_idx"     ON "ContasAPagar"("codNfe");
    CREATE INDEX "ContasAPagar_codForn_idx"    ON "ContasAPagar"("codForn");
    CREATE INDEX "ContasAPagar_codParcela_idx" ON "ContasAPagar"("codParcela");
    ALTER TABLE "ContasAPagar"
      ADD CONSTRAINT "ContasAPagar_codNfe_fkey"
      FOREIGN KEY ("codNfe") REFERENCES "NotasFiscaisEletronicas"("codNfe")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ContasAPagar"
      ADD CONSTRAINT "ContasAPagar_codForn_fkey"
      FOREIGN KEY ("codForn") REFERENCES "Fornecedores"("codForn")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ContasAPagar"
      ADD CONSTRAINT "ContasAPagar_codParcela_fkey"
      FOREIGN KEY ("codParcela") REFERENCES "Parcelas"("codParcela")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- ContasAReceber
    CREATE TABLE "ContasAReceber" (
      "codContasARec"   SERIAL         NOT NULL,
      "descricao"       VARCHAR(128),
      "vlrContasARec"   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "dtVencimento"    TIMESTAMP(3),
      "dtRecebimento"   TIMESTAMP(3),
      "status"          VARCHAR(20)    NOT NULL DEFAULT 'aberta',
      "codNfe"          INTEGER,
      "codCliente"      INTEGER        NOT NULL,
      "codFormaDePag"   INTEGER,
      "dtCriacao"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"         INTEGER,
      "isActive"        BOOLEAN        NOT NULL DEFAULT true,
      CONSTRAINT "ContasAReceber_pkey" PRIMARY KEY ("codContasARec")
    );
    CREATE INDEX "ContasAReceber_codNfe_idx"        ON "ContasAReceber"("codNfe");
    CREATE INDEX "ContasAReceber_codCliente_idx"    ON "ContasAReceber"("codCliente");
    CREATE INDEX "ContasAReceber_codFormaDePag_idx" ON "ContasAReceber"("codFormaDePag");
    ALTER TABLE "ContasAReceber"
      ADD CONSTRAINT "ContasAReceber_codNfe_fkey"
      FOREIGN KEY ("codNfe") REFERENCES "NotasFiscaisEletronicas"("codNfe")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ContasAReceber"
      ADD CONSTRAINT "ContasAReceber_codCliente_fkey"
      FOREIGN KEY ("codCliente") REFERENCES "Clientes"("codCliente")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "ContasAReceber"
      ADD CONSTRAINT "ContasAReceber_codFormaDePag_fkey"
      FOREIGN KEY ("codFormaDePag") REFERENCES "FormaDePagamento"("codFormaDePag")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Compras
    CREATE TABLE "Compras" (
      "codCompra"     SERIAL        NOT NULL,
      "dtCompra"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "obsCompra"     VARCHAR(500),
      "codNfe"        INTEGER,
      "codForn"       INTEGER       NOT NULL,
      "codTransp"     INTEGER,
      "codCondDePag"  INTEGER,
      "dtCriacao"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dtEdicao"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"       INTEGER,
      "isActive"      BOOLEAN       NOT NULL DEFAULT true,
      CONSTRAINT "Compras_pkey" PRIMARY KEY ("codCompra")
    );
    CREATE INDEX "Compras_codNfe_idx"       ON "Compras"("codNfe");
    CREATE INDEX "Compras_codForn_idx"      ON "Compras"("codForn");
    CREATE INDEX "Compras_codTransp_idx"    ON "Compras"("codTransp");
    CREATE INDEX "Compras_codCondDePag_idx" ON "Compras"("codCondDePag");
    ALTER TABLE "Compras"
      ADD CONSTRAINT "Compras_codNfe_fkey"
      FOREIGN KEY ("codNfe") REFERENCES "NotasFiscaisEletronicas"("codNfe")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Compras"
      ADD CONSTRAINT "Compras_codForn_fkey"
      FOREIGN KEY ("codForn") REFERENCES "Fornecedores"("codForn")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Compras"
      ADD CONSTRAINT "Compras_codTransp_fkey"
      FOREIGN KEY ("codTransp") REFERENCES "Transportadoras"("codTransp")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "Compras"
      ADD CONSTRAINT "Compras_codCondDePag_fkey"
      FOREIGN KEY ("codCondDePag") REFERENCES "CondicaoDePagamento"("codCondDePag")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- CompraProduto (N:N)
    CREATE TABLE "CompraProduto" (
      "codCompra"   INTEGER        NOT NULL,
      "codProduto"  INTEGER        NOT NULL,
      "qtd"         DECIMAL(10,3)  NOT NULL DEFAULT 0.000,
      "vlrUnit"     DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "vlrTotal"    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
      "dtCriacao"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "codUser"     INTEGER,
      CONSTRAINT "CompraProduto_pkey" PRIMARY KEY ("codCompra","codProduto")
    );
    ALTER TABLE "CompraProduto"
      ADD CONSTRAINT "CompraProduto_codCompra_fkey"
      FOREIGN KEY ("codCompra") REFERENCES "Compras"("codCompra")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "CompraProduto"
      ADD CONSTRAINT "CompraProduto_codProduto_fkey"
      FOREIGN KEY ("codProduto") REFERENCES "Produtos"("codProd")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS "CompraProduto"            CASCADE;
    DROP TABLE IF EXISTS "Compras"                  CASCADE;
    DROP TABLE IF EXISTS "ContasAReceber"           CASCADE;
    DROP TABLE IF EXISTS "ContasAPagar"             CASCADE;
    DROP TABLE IF EXISTS "ProdutoNfe"               CASCADE;
    DROP TABLE IF EXISTS "VeiculoNfe"               CASCADE;
    DROP TABLE IF EXISTS "NotasFiscaisEletronicas"  CASCADE;
    DROP TABLE IF EXISTS "Parcelas"                 CASCADE;
    DROP TABLE IF EXISTS "FormaDePagamento"         CASCADE;
    DROP TABLE IF EXISTS "ProdutoCategoria"         CASCADE;
    DROP TABLE IF EXISTS "ProdutoFornecedor"        CASCADE;
    DROP TABLE IF EXISTS "Produtos"                 CASCADE;
    DROP TABLE IF EXISTS "Categorias"               CASCADE;
    DROP TABLE IF EXISTS "Transportadoras"          CASCADE;
    DROP TABLE IF EXISTS "Veiculos"                 CASCADE;
    DROP TABLE IF EXISTS "Clientes"                 CASCADE;
    DROP TABLE IF EXISTS "CondicaoDePagamento"      CASCADE;
    DROP TABLE IF EXISTS "Fornecedores"             CASCADE;
    DROP TABLE IF EXISTS "Cidades"                  CASCADE;
    DROP TABLE IF EXISTS "Estados"                  CASCADE;
    DROP TABLE IF EXISTS "Paises"                   CASCADE;
    DROP TABLE IF EXISTS "Users"                    CASCADE;
  `);
};
```

> **Atenção:** o DDL da migration `Users` tem um erro de auto-referência circular
> (`codUser INTEGER` referencia a si mesma). A FK de `codUser` para `Users` é
> intencional nos outros modelos (rastreabilidade), mas em `Users` o campo
> é só auditoria (quem criou o registro). **Não adicionar FK de Users.codUser → Users
> na baseline** para evitar circularidade; isso fica para EP-10.

### Passo 3 — Recriar o banco de dados (banco limpo)

```bash
dropdb si_joao_bail_2026
createdb si_joao_bail_2026
```

> Os dados existentes são apenas seed — serão recriados pelo T-135.

### Passo 4 — Aplicar a migration

```bash
cd Backend && npm run migrate
```

Saída esperada:
```
> node-pg-migrate up
Migrating up: 1_baseline
Finished running 1 migration!
```

### Passo 5 — Verificar constraints no psql

```bash
psql si_joao_bail_2026 -c "\dt"          # listar tabelas
psql si_joao_bail_2026 -c "\d \"Paises\""  # verificar colunas e defaults
psql si_joao_bail_2026 -c "\d \"Estados\"" # verificar FK codPais
```

Checar especificamente que `dtEdicao` tem `DEFAULT CURRENT_TIMESTAMP`.

### Passo 6 — Deletar schema.prisma

```bash
rm Backend/DB/schema.prisma
```

### Aceite T-133
- `npm run migrate` numa banco limpo cria todas as 22 tabelas
- `\d "Paises"` mostra `dtEdicao` com DEFAULT CURRENT_TIMESTAMP
- Arquivo `schema.prisma` não existe mais
- `prisma.config.ts` não existe mais

---

## T-134 — Geração de tipos (kanel)

### Passo 1 — Criar `Backend/.kanelrc.js`

```js
'use strict';

module.exports = {
  connection: process.env.DATABASE_URL,
  outputPath: './src/db',
  preDeleteOutputFolder: true,
  enumStyle: 'type',
};
```

### Passo 2 — Criar diretório de saída (kanel precisa que exista ou cria automaticamente)

```bash
mkdir -p Backend/src/db
```

### Passo 3 — Rodar geração de tipos

```bash
cd Backend && npm run types:gen
```

Kanel introspeta o banco e gera um arquivo `.ts` por tabela em `src/db/`.
Exemplo de saída esperada: `src/db/Paises.ts`, `src/db/Estados.ts`, ...

### Passo 4 — Verificar typecheck

```bash
cd Backend && npm run typecheck
```

Deve passar sem erros. Se kanel gerar tipos com conflito de nomes ou imports
problemáticos, ajustar o `.kanelrc.js` (ex.: `typeFilter`, `nameTransformation`).

### Passo 5 — Adicionar `src/db/` ao `.gitignore`

Os tipos são gerados — não devem ser commitados manualmente.
Em `Backend/.gitignore`, adicionar:
```
src/db/
```

### Aceite T-134
- `npm run types:gen` gera arquivos em `src/db/` sem erro
- `npm run typecheck` passa
- `src/db/` está no `.gitignore`

---

## T-135 — Reescrever o seed com postgres.js

### Passo 1 — Reescrever `Backend/DB/seed.ts`

Substituir TODO o conteúdo atual por:

```typescript
import 'dotenv/config';
import sql from '../src/lib/db';

// ============================================================
// T-021 — Seed geográfico
// Ordem: Paises → Estados → Cidades
// ============================================================

const BRASIL = { pais: 'Brasil', sigla: 'BRA', ddi: '+55', moeda: 'BRL' };

const ESTADOS = [
  { uf: 'AC', estado: 'Acre' },
  { uf: 'AL', estado: 'Alagoas' },
  { uf: 'AP', estado: 'Amapá' },
  { uf: 'AM', estado: 'Amazonas' },
  { uf: 'BA', estado: 'Bahia' },
  { uf: 'CE', estado: 'Ceará' },
  { uf: 'DF', estado: 'Distrito Federal' },
  { uf: 'ES', estado: 'Espírito Santo' },
  { uf: 'GO', estado: 'Goiás' },
  { uf: 'MA', estado: 'Maranhão' },
  { uf: 'MT', estado: 'Mato Grosso' },
  { uf: 'MS', estado: 'Mato Grosso do Sul' },
  { uf: 'MG', estado: 'Minas Gerais' },
  { uf: 'PA', estado: 'Pará' },
  { uf: 'PB', estado: 'Paraíba' },
  { uf: 'PR', estado: 'Paraná' },
  { uf: 'PE', estado: 'Pernambuco' },
  { uf: 'PI', estado: 'Piauí' },
  { uf: 'RJ', estado: 'Rio de Janeiro' },
  { uf: 'RN', estado: 'Rio Grande do Norte' },
  { uf: 'RS', estado: 'Rio Grande do Sul' },
  { uf: 'RO', estado: 'Rondônia' },
  { uf: 'RR', estado: 'Roraima' },
  { uf: 'SC', estado: 'Santa Catarina' },
  { uf: 'SP', estado: 'São Paulo' },
  { uf: 'SE', estado: 'Sergipe' },
  { uf: 'TO', estado: 'Tocantins' },
];

// Amostra representativa (mesmas cidades do seed original)
const CIDADES_POR_UF: Record<string, { cidade: string; ddd: string }[]> = {
  SP: [
    { cidade: 'São Paulo',      ddd: '11' },
    { cidade: 'Campinas',       ddd: '19' },
    { cidade: 'Ribeirão Preto', ddd: '16' },
  ],
  MG: [
    { cidade: 'Belo Horizonte', ddd: '31' },
    { cidade: 'Uberlândia',     ddd: '34' },
  ],
  RS: [
    { cidade: 'Porto Alegre',   ddd: '51' },
    { cidade: 'Caxias do Sul',  ddd: '54' },
  ],
  SC: [
    { cidade: 'Florianópolis',  ddd: '48' },
    { cidade: 'Joinville',      ddd: '47' },
  ],
  PR: [
    { cidade: 'Curitiba',       ddd: '41' },
    { cidade: 'Londrina',       ddd: '43' },
  ],
  RJ: [
    { cidade: 'Rio de Janeiro', ddd: '21' },
    { cidade: 'Niterói',        ddd: '21' },
  ],
  BA: [{ cidade: 'Salvador',    ddd: '71' }],
  PE: [{ cidade: 'Recife',      ddd: '81' }],
  CE: [{ cidade: 'Fortaleza',   ddd: '85' }],
  AM: [{ cidade: 'Manaus',      ddd: '92' }],
  PA: [{ cidade: 'Belém',       ddd: '91' }],
  GO: [{ cidade: 'Goiânia',     ddd: '62' }],
  DF: [{ cidade: 'Brasília',    ddd: '61' }],
  MT: [{ cidade: 'Cuiabá',      ddd: '65' }],
  MS: [{ cidade: 'Campo Grande',ddd: '67' }],
};

// ============================================================
// T-022 — Seed de catálogo e parceiros
// ============================================================

const CATEGORIAS = [
  { categoria: 'Hardware' },
  { categoria: 'Software' },
  { categoria: 'Periféricos' },
  { categoria: 'Redes' },
  { categoria: 'Armazenamento' },
  { categoria: 'Acessórios' },
];

const PRODUTOS = [
  { nomeProd: 'Processador Intel Core i5-12400', descProd: 'Processador 6 núcleos 2.5GHz',  unidMedProd: 'UN', pesoBrutoProd: 0.100, pesoLiqProd: 0.050, saldoProd: 0, custoMedioProd: 850.00,  categoria: 'Hardware' },
  { nomeProd: 'Memória RAM 16GB DDR4',            descProd: 'Memória DDR4 3200MHz',           unidMedProd: 'UN', pesoBrutoProd: 0.050, pesoLiqProd: 0.030, saldoProd: 0, custoMedioProd: 280.00,  categoria: 'Hardware' },
  { nomeProd: 'SSD 512GB NVMe',                   descProd: 'SSD M.2 NVMe PCIe 3.0',         unidMedProd: 'UN', pesoBrutoProd: 0.020, pesoLiqProd: 0.010, saldoProd: 0, custoMedioProd: 320.00,  categoria: 'Armazenamento' },
  { nomeProd: 'Mouse Óptico USB',                 descProd: 'Mouse 1200 DPI com fio',         unidMedProd: 'UN', pesoBrutoProd: 0.150, pesoLiqProd: 0.100, saldoProd: 0, custoMedioProd: 45.00,   categoria: 'Periféricos' },
  { nomeProd: 'Cabo de Rede Cat6 1m',             descProd: 'Cabo Ethernet RJ45 Cat6 1 metro',unidMedProd: 'UN', pesoBrutoProd: 0.080, pesoLiqProd: 0.060, saldoProd: 0, custoMedioProd: 12.00,   categoria: 'Redes' },
];

const CONDICAO_PAGAMENTO = {
  condicao: 'À Vista',
  juros: 0.00,
  multa: 0.00,
  desconto: 0.00,
};

const FORNECEDORES = [
  {
    nomeForn:       'TechDistrib LTDA',
    fantasiaForn:   'TechDistrib',
    cpfCnpjForn:    '12345678000195',
    emailForn:      'contato@techdistrib.com.br',
    foneForn:       '5511987654321',
    logradouroForn: 'Avenida Paulista',
    numForn:        '1000',
    bairroForn:     'Bela Vista',
    cepForn:        '01310100',
    cidade:         'São Paulo',
    uf:             'SP',
  },
  {
    nomeForn:       'InfoSuply EIRELI',
    fantasiaForn:   'InfoSuply',
    cpfCnpjForn:    '98765432000111',
    emailForn:      'vendas@infosuply.com.br',
    foneForn:       '5531976543210',
    logradouroForn: 'Rua dos Tupinambás',
    numForn:        '200',
    bairroForn:     'Centro',
    cepForn:        '30120040',
    cidade:         'Belo Horizonte',
    uf:             'MG',
  },
];

const CLIENTES = [
  {
    nomeCl:       'João Bail',
    cpfCnpjCl:    '12345678901',
    emailCl:      'joao@bail.com.br',
    foneCl:       '5541987654321',
    logradouroCl: 'Rua XV de Novembro',
    numCl:        '123',
    bairroCl:     'Centro',
    cepCl:        '80020310',
    cidade:       'Curitiba',
    uf:           'PR',
  },
  {
    nomeCl:       'Maria Informática ME',
    cpfCnpjCl:    '11222333000181',
    emailCl:      'maria@informatica.com.br',
    foneCl:       '5541912345678',
    logradouroCl: 'Avenida Sete de Setembro',
    numCl:        '456',
    bairroCl:     'Batel',
    cepCl:        '80230000',
    cidade:       'Curitiba',
    uf:           'PR',
  },
];

const VEICULO = {
  placa:    'ABC1234',
  modelo:   'Sprinter',
  marca:    'Mercedes-Benz',
  uf:       'SP',
};

const TRANSPORTADORA = {
  nomeTransp:       'LogExpress LTDA',
  fantasiaTransp:   'LogExpress',
  cpfCnpjTransp:    '55443322000199',
  emailTransp:      'frete@logexpress.com.br',
  foneTransp:       '5511955443322',
  logradouroTransp: 'Rua do Transporte',
  numTransp:        '789',
  bairroTransp:     'Jardim Industrial',
  cepTransp:        '02000001',
  cidade:           'São Paulo',
  uf:               'SP',
};

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('Iniciando seed...');

  // Paises
  const [brasil] = await sql`
    INSERT INTO "Paises" ("pais","sigla","ddi","moeda")
    VALUES (${BRASIL.pais},${BRASIL.sigla},${BRASIL.ddi},${BRASIL.moeda})
    ON CONFLICT ("sigla") DO UPDATE SET
      "pais"  = EXCLUDED."pais",
      "ddi"   = EXCLUDED."ddi",
      "moeda" = EXCLUDED."moeda"
    RETURNING "codPais"
  `;
  const codPais = brasil.codPais;
  console.log('  ✓ Brasil inserido:', codPais);

  // Estados
  const estadosInseridos: Record<string, number> = {};
  for (const e of ESTADOS) {
    const [row] = await sql`
      INSERT INTO "Estados" ("uf","estado","codPais")
      VALUES (${e.uf},${e.estado},${codPais})
      ON CONFLICT DO NOTHING
      RETURNING "codEstado","uf"
    `;
    if (row) estadosInseridos[e.uf] = row.codEstado;
    else {
      const [existing] = await sql`
        SELECT "codEstado" FROM "Estados" WHERE "uf" = ${e.uf}
      `;
      estadosInseridos[e.uf] = existing.codEstado;
    }
  }
  console.log(`  ✓ ${ESTADOS.length} estados inseridos/verificados`);

  // Cidades
  const cidadesInseridas: Record<string, number> = {};
  for (const [uf, cidades] of Object.entries(CIDADES_POR_UF)) {
    const codEstado = estadosInseridos[uf];
    if (!codEstado) continue;
    for (const c of cidades) {
      const [row] = await sql`
        INSERT INTO "Cidades" ("cidade","ddd","codEstado")
        VALUES (${c.cidade},${c.ddd},${codEstado})
        ON CONFLICT DO NOTHING
        RETURNING "codCidade","cidade"
      `;
      if (row) cidadesInseridas[`${uf}|${c.cidade}`] = row.codCidade;
      else {
        const [existing] = await sql`
          SELECT "codCidade" FROM "Cidades"
          WHERE "cidade" = ${c.cidade} AND "codEstado" = ${codEstado}
        `;
        cidadesInseridas[`${uf}|${c.cidade}`] = existing.codCidade;
      }
    }
  }
  console.log(`  ✓ Cidades inseridas/verificadas`);

  // Categorias
  const categoriasInseridas: Record<string, number> = {};
  for (const cat of CATEGORIAS) {
    const [row] = await sql`
      INSERT INTO "Categorias" ("categoria")
      VALUES (${cat.categoria})
      ON CONFLICT DO NOTHING
      RETURNING "codCategoria","categoria"
    `;
    if (row) categoriasInseridas[cat.categoria] = row.codCategoria;
    else {
      const [existing] = await sql`
        SELECT "codCategoria" FROM "Categorias" WHERE "categoria" = ${cat.categoria}
      `;
      categoriasInseridas[cat.categoria] = existing.codCategoria;
    }
  }
  console.log(`  ✓ ${CATEGORIAS.length} categorias inseridas/verificadas`);

  // Produtos
  for (const p of PRODUTOS) {
    const codCategoria = categoriasInseridas[p.categoria];
    await sql`
      INSERT INTO "Produtos" (
        "nomeProd","descProd","unidMedProd","pesoBrutoProd","pesoLiqProd",
        "saldoProd","custoMedioProd","codCategoria"
      )
      VALUES (
        ${p.nomeProd},${p.descProd},${p.unidMedProd},${p.pesoBrutoProd},${p.pesoLiqProd},
        ${p.saldoProd},${p.custoMedioProd},${codCategoria}
      )
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${PRODUTOS.length} produtos inseridos/verificados`);

  // CondicaoDePagamento
  const [condPag] = await sql`
    INSERT INTO "CondicaoDePagamento" ("condicao","juros","multa","desconto")
    VALUES (${CONDICAO_PAGAMENTO.condicao},${CONDICAO_PAGAMENTO.juros},
            ${CONDICAO_PAGAMENTO.multa},${CONDICAO_PAGAMENTO.desconto})
    ON CONFLICT DO NOTHING
    RETURNING "codCondDePag"
  `;
  const codCondDePag = condPag?.codCondDePag ?? (
    await sql`SELECT "codCondDePag" FROM "CondicaoDePagamento" WHERE "condicao" = ${CONDICAO_PAGAMENTO.condicao}`
  )[0].codCondDePag;
  console.log('  ✓ Condição de pagamento inserida/verificada');

  // Fornecedores
  for (const f of FORNECEDORES) {
    const codCidade = cidadesInseridas[`${f.uf}|${f.cidade}`];
    if (!codCidade) { console.warn(`  ⚠ Cidade não encontrada: ${f.uf}|${f.cidade}`); continue; }
    await sql`
      INSERT INTO "Fornecedores" (
        "nomeForn","fantasiaForn","cpfCnpjForn","emailForn","foneForn",
        "logradouroForn","numForn","bairroForn","cepForn","codCidade"
      )
      VALUES (
        ${f.nomeForn},${f.fantasiaForn},${f.cpfCnpjForn},${f.emailForn},${f.foneForn},
        ${f.logradouroForn},${f.numForn},${f.bairroForn},${f.cepForn},${codCidade}
      )
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${FORNECEDORES.length} fornecedores inseridos/verificados`);

  // Clientes
  for (const c of CLIENTES) {
    const codCidade = cidadesInseridas[`${c.uf}|${c.cidade}`];
    if (!codCidade) { console.warn(`  ⚠ Cidade não encontrada: ${c.uf}|${c.cidade}`); continue; }
    await sql`
      INSERT INTO "Clientes" (
        "nomeCl","cpfCnpjCl","emailCl","foneCl",
        "logradouroCl","numCl","bairroCl","cepCl",
        "codCidade","codCondDePag"
      )
      VALUES (
        ${c.nomeCl},${c.cpfCnpjCl},${c.emailCl},${c.foneCl},
        ${c.logradouroCl},${c.numCl},${c.bairroCl},${c.cepCl},
        ${codCidade},${codCondDePag}
      )
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${CLIENTES.length} clientes inseridos/verificados`);

  // Veículo
  const codEstadoSP = estadosInseridos[VEICULO.uf];
  await sql`
    INSERT INTO "Veiculos" ("placa","modelo","marca","codEstado")
    VALUES (${VEICULO.placa},${VEICULO.modelo},${VEICULO.marca},${codEstadoSP})
    ON CONFLICT DO NOTHING
  `;
  console.log('  ✓ Veículo inserido/verificado');

  // Transportadora
  const codCidadeTransp = cidadesInseridas[`${TRANSPORTADORA.uf}|${TRANSPORTADORA.cidade}`];
  if (codCidadeTransp) {
    await sql`
      INSERT INTO "Transportadoras" (
        "nomeTransp","fantasiaTransp","cpfCnpjTransp","emailTransp","foneTransp",
        "logradouroTransp","numTransp","bairroTransp","cepTransp","codCidade"
      )
      VALUES (
        ${TRANSPORTADORA.nomeTransp},${TRANSPORTADORA.fantasiaTransp},
        ${TRANSPORTADORA.cpfCnpjTransp},${TRANSPORTADORA.emailTransp},${TRANSPORTADORA.foneTransp},
        ${TRANSPORTADORA.logradouroTransp},${TRANSPORTADORA.numTransp},
        ${TRANSPORTADORA.bairroTransp},${TRANSPORTADORA.cepTransp},${codCidadeTransp}
      )
      ON CONFLICT DO NOTHING
    `;
    console.log('  ✓ Transportadora inserida/verificada');
  }

  console.log('Seed concluído!');
  await sql.end();
}

main().catch((err) => {
  console.error('Erro no seed:', err);
  sql.end().finally(() => process.exit(1));
});
```

### Passo 2 — Rodar o seed pela primeira vez

```bash
cd Backend && npm run seed
```

### Passo 3 — Verificar contagens

```bash
psql si_joao_bail_2026 -c "SELECT COUNT(*) FROM \"Paises\""      # 1
psql si_joao_bail_2026 -c "SELECT COUNT(*) FROM \"Estados\""     # 27
psql si_joao_bail_2026 -c "SELECT COUNT(*) FROM \"Cidades\""     # ~36
psql si_joao_bail_2026 -c "SELECT COUNT(*) FROM \"Categorias\""  # 6
psql si_joao_bail_2026 -c "SELECT COUNT(*) FROM \"Produtos\""    # 5
```

### Passo 4 — Verificar idempotência (rodar novamente)

```bash
cd Backend && npm run seed
```

Contagens devem ser idênticas.

### Aceite T-135
- `npm run seed` roda 2× sem duplicar registros
- Contagens batem: 1 país, 27 estados, 36+ cidades, 6 categorias, 5 produtos,
  1 condição de pagamento, 2 fornecedores, 2 clientes, 1 veículo, 1 transportadora

---

## T-136 — Mapear erros do Postgres + helper de teste de repositório

### Passo 1 — Atualizar `Backend/src/shared/middleware/errorHandler.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ mensagem: err.mensagem });
    return;
  }

  if ('code' in err) {
    const pgCode = (err as { code: string }).code;
    if (pgCode === '23505') {
      res.status(409).json({ mensagem: 'Registro duplicado: este valor já existe.' });
      return;
    }
    if (pgCode === '23503') {
      res.status(409).json({ mensagem: 'Operação bloqueada: registro possui dependências.' });
      return;
    }
  }

  console.error('[Erro inesperado]', err);
  res.status(500).json({ mensagem: 'Erro interno do servidor' });
}
```

### Passo 2 — Criar `Backend/src/__tests__/helpers/db.ts`

```typescript
import sql from '../../lib/db';
import type postgres from 'postgres';

class TestRollback extends Error {
  constructor() {
    super('__test_rollback__');
  }
}

/**
 * Executa `fn` dentro de uma transação que é sempre revertida ao final.
 * Isola efeitos colaterais de testes de integração de repositório.
 */
export async function withTestTransaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  let result!: T;
  try {
    await sql.begin(async (tx) => {
      result = await fn(tx);
      throw new TestRollback();
    });
  } catch (err) {
    if (!(err instanceof TestRollback)) throw err;
  }
  return result;
}
```

### Passo 3 — Escrever teste-piloto de integração

Criar `Backend/src/__tests__/db-helper.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import sql from '../lib/db';
import { withTestTransaction } from './helpers/db';

describe('withTestTransaction', () => {
  afterAll(async () => {
    await sql.end();
  });

  it('rollback automático: inserção não persiste após o bloco', async () => {
    let codPaisInserido: number | undefined;

    await withTestTransaction(async (tx) => {
      const [row] = await tx`
        INSERT INTO "Paises" ("pais","sigla","ddi","moeda")
        VALUES ('TestePais','TST','+00','TST')
        RETURNING "codPais"
      `;
      codPaisInserido = row.codPais;
    });

    // Fora da transação: não deve existir
    const [check] = await sql`
      SELECT 1 FROM "Paises" WHERE "sigla" = 'TST'
    `;
    expect(check).toBeUndefined();
    expect(codPaisInserido).toBeDefined();
  });
});
```

> Este é um **teste de integração** — requer banco rodando. Para o CI separar
> unit de integração, o Vitest pode filtrar por arquivo ou tag.

### Passo 4 — Atualizar teste do errorHandler para cobrir códigos PG

Em `Backend/src/__tests__/errorHandler.test.ts`, adicionar:

```typescript
it('retorna 409 para violação unique (PG 23505)', () => {
  const pgError = Object.assign(new Error('unique violation'), { code: '23505' });
  errorHandler(pgError, mockReq, mockRes as Response, mockNext);
  expect(mockRes.status).toHaveBeenCalledWith(409);
  expect(mockRes.json).toHaveBeenCalledWith({
    mensagem: 'Registro duplicado: este valor já existe.',
  });
});

it('retorna 409 para violação de FK (PG 23503)', () => {
  const pgError = Object.assign(new Error('fk violation'), { code: '23503' });
  errorHandler(pgError, mockReq, mockRes as Response, mockNext);
  expect(mockRes.status).toHaveBeenCalledWith(409);
  expect(mockRes.json).toHaveBeenCalledWith({
    mensagem: 'Operação bloqueada: registro possui dependências.',
  });
});
```

### Passo 5 — Rodar todos os testes

```bash
cd Backend && npm test
```

### Aceite T-136
- Violação unique retorna 409 com mensagem PT
- Violação FK retorna 409 com mensagem PT
- `withTestTransaction` reverte inserção (teste-piloto passa)

---

## T-137 — Fixar o padrão de repository (template para EP-04+)

### Passo 1 — Criar `Backend/src/shared/repositories/_example.repository.ts`

Este arquivo serve como **molde** para todos os repositórios de EP-04+.
Não é código de produção — é referência comentada.

```typescript
/**
 * MOLDE DE REPOSITÓRIO — copie e adapte para cada entidade.
 *
 * Convenções obrigatórias (ver docs/02-arquitetura.md#acesso-a-dados-postgresjs):
 * 1. Valores sempre por interpolação ${}  — nunca concatenação de string.
 * 2. Identificadores dinâmicos só por whitelist sql(col).
 * 3. Queries filtram isActive = true (exceto quando buscando inativos).
 * 4. "Deleção" é soft delete: UPDATE SET isActive = false.
 * 5. Todo INSERT preenche codUser; todo UPDATE preenche codUser + dtEdicao.
 * 6. Paginação por cursor sobre codX (sem OFFSET).
 */
import type postgres from 'postgres';
import sql from '../../../lib/db';

// Tipo gerado pelo kanel — importe de src/db/<Tabela>
// import type { Paises } from '../../db/Paises';

// ---- Tipos de entrada ----
interface CreateExemploInput {
  campo: string;
  codUser: number;
}

interface UpdateExemploInput {
  campo: string;
  codUser: number;
}

// ---- Repository ----
export class ExemploRepository {
  // Listar (paginação por cursor)
  async list(limit: number, afterId?: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    return client`
      SELECT *
      FROM   "Tabela"
      WHERE  "isActive" = true
        AND  ("codX" > ${afterId ?? 0})
      ORDER BY "codX"
      LIMIT  ${limit}
    `;
  }

  // Obter por id
  async findById(id: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      SELECT *
      FROM   "Tabela"
      WHERE  "codX"     = ${id}
        AND  "isActive" = true
    `;
    return row ?? null;
  }

  // Criar
  async create(data: CreateExemploInput, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      INSERT INTO "Tabela" ("campo","codUser")
      VALUES (${data.campo},${data.codUser})
      RETURNING *
    `;
    return row;
  }

  // Atualizar
  async update(id: number, data: UpdateExemploInput, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      UPDATE "Tabela"
      SET    "campo"    = ${data.campo},
             "codUser"  = ${data.codUser},
             "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codX"    = ${id}
        AND  "isActive" = true
      RETURNING *
    `;
    return row ?? null;
  }

  // Soft delete
  async remove(id: number, codUser: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      UPDATE "Tabela"
      SET    "isActive" = false,
             "codUser"  = ${codUser},
             "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codX"    = ${id}
        AND  "isActive" = true
      RETURNING "codX"
    `;
    return row ?? null;
  }

  // Verificar dependentes (para RN002 em soft delete)
  async hasDependents(id: number) {
    const [row] = await sql`
      SELECT 1
      FROM   "TabelaDependente"
      WHERE  "codX"     = ${id}
        AND  "isActive" = true
      LIMIT 1
    `;
    return !!row;
  }
}
```

### Aceite T-137
- Arquivo existe em `src/shared/repositories/_example.repository.ts`
- Demonstra todos os padrões: valores por `${}`, whitelist para identificadores,
  filtro `isActive`, soft delete, auditoria, cursor

---

## T-138 — Sincronizar documentação

### Arquivos a atualizar

Para cada arquivo abaixo, remover toda referência a Prisma como ferramenta **ativa**
e substituir pela stack real. As atualizações são textuais — não alteram o código.

1. **`docs/02-arquitetura.md`** — seção "Acesso a dados":
   - Substituir menção ao `PrismaClient` pela descrição do cliente postgres.js
   - Confirmar que o bloco "padrão de repository" descreve SQL direto com tagged templates

2. **`docs/03-stack-tecnologica.md`** — coluna "Acesso a dados":
   - Remover Prisma da tabela de stack
   - Confirmar: postgres.js, node-pg-migrate, kanel como ferramentas ativas

3. **`docs/06-modelo-de-dados.md`** — nota de "migrations":
   - Atualizar para "migrations SQL em `Backend/DB/migrations/` via node-pg-migrate"
   - Remover referência a `schema.prisma` como fonte de verdade

4. **`docs/08-seguranca-e-autenticacao.md`** — seção SQLi:
   - Confirmar que o padrão de defesa já descreve tagged templates do postgres.js

5. **`docs/09-roadmap.md`** — EP-13:
   - Marcar EP-13 como concluído (status da fase)

6. **`docs/10-glossario.md`** — verbetes:
   - Confirmar que postgres.js, node-pg-migrate e kanel têm definições corretas
   - Remover verbete "Prisma" ou mover para "Histórico"

7. **`README.md`** — seção "Como rodar":
   - Substituir `npx prisma migrate dev` por `npm run migrate`
   - Substituir `npx prisma db seed` por `npm run seed`
   - Adicionar `npm run types:gen`

8. **`CLAUDE.md`** — bloco "Estado atual":
   - Atualizar para refletir que EP-13 foi concluído
   - Remover alerta "⚠️ Transição de stack em andamento"
   - Atualizar "Próximo passo" para EP-04

9. **`docs/11-backlog.md`** — EP-13:
   - Marcar todos os checkboxes de T-130 a T-138 como `[x]`

### Aceite T-138
- `grep -r "prisma" docs/ Backend/src` não retorna arquivos ativos (somente
  menções históricas como "foi feito com Prisma" nos épicos concluídos)
- CLAUDE.md reflete corretamente o novo estado

---

## Verificação final do EP-13

```bash
cd Backend

# 1. Testes passam
npm test

# 2. Typecheck limpo
npm run typecheck

# 3. Lint limpo
npm run lint

# 4. Server sobe com novo cliente
npm run dev &
sleep 2
curl http://localhost:5000/health
# {"status":"ok"}
kill %1

# 5. Migration e seed rodando do zero
dropdb si_joao_bail_2026
createdb si_joao_bail_2026
npm run migrate
npm run seed
npm run types:gen
npm run typecheck
```

---

## Arquivos críticos modificados/criados

| Ação        | Arquivo                                                  |
|-------------|----------------------------------------------------------|
| CRIAR       | `Backend/src/lib/db.ts`                                  |
| CRIAR       | `Backend/.kanelrc.js`                                    |
| CRIAR       | `Backend/database.json`                                  |
| CRIAR       | `Backend/DB/migrations/1_baseline.js`                    |
| CRIAR       | `Backend/src/__tests__/helpers/db.ts`                    |
| CRIAR       | `Backend/src/shared/repositories/_example.repository.ts` |
| REESCREVER  | `Backend/src/server.ts`                                  |
| REESCREVER  | `Backend/src/shared/transaction/withTransaction.ts`      |
| REESCREVER  | `Backend/src/shared/middleware/errorHandler.ts`          |
| REESCREVER  | `Backend/src/__tests__/withTransaction.test.ts`          |
| REESCREVER  | `Backend/DB/seed.ts`                                     |
| EDITAR      | `Backend/package.json`                                   |
| DELETAR     | `Backend/src/lib/prisma.ts`                              |
| DELETAR     | `Backend/prisma.config.ts`                               |
| DELETAR     | `Backend/DB/schema.prisma`                               |
| ARQUIVAR    | `Backend/DB/migrations/` → `Backend/DB/migrations-prisma/` |
| GERAR       | `Backend/src/db/` (kanel — não editar manualmente)       |
| ATUALIZAR   | `docs/02`, `03`, `06`, `08`, `09`, `10`, `11`, `README.md`, `CLAUDE.md` |
