# EP-04 — Passo-a-passo de implementação (Países, Estados, Cidades) + Frontend

> Guia executável com os trechos de código a adicionar/atualizar para concluir a EP-04
> (backend dos 3 CRUDs geográficos) e o frontend correspondente (T-113), incluindo o
> bootstrap restante do SPA (EP-11).

## Context

Fase 0 (EP-00→EP-03) e EP-13 concluídas: tabelas `Paises`/`Estados`/`Cidades` já migradas,
tipos kanel em `Backend/src/db/types/public/`, seed idempotente, e infra compartilhada pronta
(`AppError`, `errorHandler` com mapeamento PG 23505/23503, `withTransaction`, `authMiddleware`
stub que injeta `req.codUser = 1`, `validate` Zod). Molde em
`Backend/src/shared/repositories/_example.repository.ts`.

EP-04 entrega os 3 primeiros CRUDs (pré-requisito dos demais). Decisões do usuário:
**escopo = backend + frontend (T-113)**; **listagem por cursor sobre `codX`**. Como a EP-11
(bootstrap do SPA) está parcial, ela é concluída antes das telas. Ordem obrigatória:
Países → Estados → Cidades; por entidade Read → Create/Update → Delete; **TDD em todo service**.

Colunas reais (da migration `1_baseline.js`):
- `Paises`: `pais` VARCHAR(6), `sigla` VARCHAR(3) UNIQUE, `ddi` VARCHAR(4), `moeda` VARCHAR(3)
- `Estados`: `codPais` FK, `uf` VARCHAR(2), `estado` VARCHAR(22)
- `Cidades`: `codEstado` FK, `cidade` VARCHAR(32), `ddd` VARCHAR(2)

---

# PARTE A — Backend EP-04

Estrutura por módulo: `Backend/src/modules/<entidade>/` com `*.repository.ts`, `*.service.ts`,
`*.controller.ts`, `*.routes.ts`, `*.schema.ts` e os 3 testes (`*.service.test.ts`,
`*.routes.test.ts`, `*.repository.test.ts`).

## A1. Países

### Passo 1 — `modules/paises/paises.schema.ts`
```ts
import { z } from 'zod';

export const createPaisSchema = z.object({
  pais: z
    .string({ message: 'O nome do país é obrigatório.' })
    .trim()
    .min(1, 'Informe o nome do país.')
    .max(6, 'O nome do país deve ter no máximo 6 caracteres.'),
  sigla: z
    .string({ message: 'A sigla é obrigatória.' })
    .trim()
    .min(1, 'Informe a sigla.')
    .max(3, 'A sigla deve ter no máximo 3 caracteres.'),
  ddi: z.string().trim().max(4).optional(),
  moeda: z.string().trim().max(3).optional(),
});

export const updatePaisSchema = createPaisSchema;

export type CreatePaisInput = z.infer<typeof createPaisSchema>;
export type UpdatePaisInput = z.infer<typeof updatePaisSchema>;
```

### Passo 2 — `modules/paises/paises.repository.ts`
```ts
import type postgres from 'postgres';
import sql from '../../lib/db';
import type Paises from '../../db/types/public/Paises';
import type { CreatePaisInput, UpdatePaisInput } from './paises.schema';

export class PaisesRepository {
  async list(limit: number, afterId = 0, tx?: postgres.TransactionSql): Promise<Paises[]> {
    const client = tx ?? sql;
    return client<Paises[]>`
      SELECT *
      FROM   "Paises"
      WHERE  "isActive" = true
        AND  "codPais" > ${afterId}
      ORDER BY "codPais"
      LIMIT  ${limit}
    `;
  }

  async findById(id: number, tx?: postgres.TransactionSql): Promise<Paises | null> {
    const client = tx ?? sql;
    const [row] = await client<Paises[]>`
      SELECT * FROM "Paises" WHERE "codPais" = ${id} AND "isActive" = true
    `;
    return row ?? null;
  }

  async create(data: CreatePaisInput, codUser: number, tx?: postgres.TransactionSql): Promise<Paises> {
    const client = tx ?? sql;
    const [row] = await client<Paises[]>`
      INSERT INTO "Paises" ("pais", "sigla", "ddi", "moeda", "codUser")
      VALUES (${data.pais}, ${data.sigla}, ${data.ddi ?? null}, ${data.moeda ?? null}, ${codUser})
      RETURNING *
    `;
    return row;
  }

  async update(id: number, data: UpdatePaisInput, codUser: number, tx?: postgres.TransactionSql): Promise<Paises | null> {
    const client = tx ?? sql;
    const [row] = await client<Paises[]>`
      UPDATE "Paises"
      SET    "pais" = ${data.pais}, "sigla" = ${data.sigla},
             "ddi" = ${data.ddi ?? null}, "moeda" = ${data.moeda ?? null},
             "codUser" = ${codUser}, "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codPais" = ${id} AND "isActive" = true
      RETURNING *
    `;
    return row ?? null;
  }

  async remove(id: number, codUser: number, tx?: postgres.TransactionSql): Promise<{ codPais: number } | null> {
    const client = tx ?? sql;
    const [row] = await client<{ codPais: number }[]>`
      UPDATE "Paises"
      SET    "isActive" = false, "codUser" = ${codUser}, "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codPais" = ${id} AND "isActive" = true
      RETURNING "codPais"
    `;
    return row ?? null;
  }

  async hasDependents(id: number, tx?: postgres.TransactionSql): Promise<boolean> {
    const client = tx ?? sql;
    const [row] = await client`
      SELECT 1 FROM "Estados" WHERE "codPais" = ${id} AND "isActive" = true LIMIT 1
    `;
    return !!row;
  }
}
```

### Passo 3 (TDD - Red) — `modules/paises/paises.service.test.ts`
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaisesService } from './paises.service';
import { AppError } from '../../shared/errors/AppError';

function makeRepo(over: Partial<Record<string, ReturnType<typeof vi.fn>>> = {}) {
  return {
    list: vi.fn(), findById: vi.fn(), create: vi.fn(),
    update: vi.fn(), remove: vi.fn(), hasDependents: vi.fn(), ...over,
  };
}

describe('PaisesService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: PaisesService;
  beforeEach(() => { repo = makeRepo(); service = new PaisesService(repo as never); });

  it('getPais lança 404 quando não existe', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getPais(99)).rejects.toMatchObject({ status: 404 });
  });

  it('createPais delega ao repo com codUser', async () => {
    repo.create.mockResolvedValue({ codPais: 1 });
    await service.createPais({ pais: 'Brasil', sigla: 'BR' } as never, 7);
    expect(repo.create).toHaveBeenCalledWith({ pais: 'Brasil', sigla: 'BR' }, 7);
  });

  it('updatePais lança 404 quando o registro não existe', async () => {
    repo.update.mockResolvedValue(null);
    await expect(service.updatePais(99, {} as never, 1)).rejects.toMatchObject({ status: 404 });
  });

  it('removePais bloqueia quando há estados vinculados (RN002)', async () => {
    repo.findById.mockResolvedValue({ codPais: 1 });
    repo.hasDependents.mockResolvedValue(true);
    await expect(service.removePais(1, 1)).rejects.toBeInstanceOf(AppError);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('removePais faz soft delete sem dependentes', async () => {
    repo.findById.mockResolvedValue({ codPais: 1 });
    repo.hasDependents.mockResolvedValue(false);
    await service.removePais(1, 5);
    expect(repo.remove).toHaveBeenCalledWith(1, 5);
  });
});
```

### Passo 4 (TDD - Green) — `modules/paises/paises.service.ts`
```ts
import { AppError } from '../../shared/errors/AppError';
import { PaisesRepository } from './paises.repository';
import type { CreatePaisInput, UpdatePaisInput } from './paises.schema';

export class PaisesService {
  constructor(private readonly repo: PaisesRepository = new PaisesRepository()) {}

  async listPaises(limit = 50, afterId = 0) {
    return this.repo.list(limit, afterId);
  }

  async getPais(id: number) {
    const pais = await this.repo.findById(id);
    if (!pais) throw new AppError('País não encontrado.', 404);
    return pais;
  }

  async createPais(data: CreatePaisInput, codUser: number) {
    return this.repo.create(data, codUser);
  }

  async updatePais(id: number, data: UpdatePaisInput, codUser: number) {
    const atualizado = await this.repo.update(id, data, codUser);
    if (!atualizado) throw new AppError('País não encontrado.', 404);
    return atualizado;
  }

  async removePais(id: number, codUser: number) {
    const existe = await this.repo.findById(id);
    if (!existe) throw new AppError('País não encontrado.', 404);
    if (await this.repo.hasDependents(id)) {
      throw new AppError('Não é possível excluir: há estados vinculados a este país.', 409);
    }
    await this.repo.remove(id, codUser);
  }
}
```

### Passo 5 — `modules/paises/paises.controller.ts`
```ts
import type { Request, Response, NextFunction } from 'express';
import { PaisesService } from './paises.service';

export class PaisesController {
  constructor(private readonly service: PaisesService = new PaisesService()) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const afterId = Number(req.query.after) || 0;
      res.status(200).json(await this.service.listPaises(limit, afterId));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json(await this.service.getPais(Number(req.params.id))); }
    catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json(await this.service.createPais(req.body, req.codUser!)); }
    catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json(await this.service.updatePais(Number(req.params.id), req.body, req.codUser!)); }
    catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try { await this.service.removePais(Number(req.params.id), req.codUser!); res.status(204).send(); }
    catch (err) { next(err); }
  };
}
```

### Passo 6 — `modules/paises/paises.routes.ts`
```ts
import { Router } from 'express';
import { PaisesController } from './paises.controller';
import { validate } from '../../shared/validation/validate';
import { createPaisSchema, updatePaisSchema } from './paises.schema';

const router = Router();
const controller = new PaisesController();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createPaisSchema), controller.create);
router.put('/:id', validate(updatePaisSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
```

### Passo 7 — registrar em `app.ts`
```ts
// no topo, junto dos demais imports:
import paisesRoutes from './modules/paises/paises.routes';

// depois de `app.use(authMiddleware);` (substituindo o comentário da linha 27):
app.use('/api/paises', paisesRoutes);
```

### Passo 8 — testes de integração de rotas — `modules/paises/paises.routes.test.ts`
> Cobrem GET + erros (não escrevem no banco). A cobertura do caminho de escrita está no
> service (mockado) e no repository (rollback).
```ts
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe('Paises routes', () => {
  afterAll(async () => { await sql.end(); });

  it('GET /api/paises retorna 200 e um array', async () => {
    const res = await request(app).get('/api/paises');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/paises/:id inexistente retorna 404 com mensagem PT', async () => {
    const res = await request(app).get('/api/paises/999999');
    expect(res.status).toBe(404);
    expect(res.body.mensagem).toBeDefined();
  });

  it('POST /api/paises com payload inválido retorna 400', async () => {
    const res = await request(app).post('/api/paises').send({ sigla: 'BR' });
    expect(res.status).toBe(400);
  });
});
```

### Passo 9 — testes de integração de repositório (rollback) — `modules/paises/paises.repository.test.ts`
```ts
import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../../__tests__/helpers/db-helper';
import { PaisesRepository } from './paises.repository';

const repo = new PaisesRepository();

describe('PaisesRepository (rollback)', () => {
  afterAll(async () => { await sql.end(); });

  it('create insere e findById recupera dentro da transação', async () => {
    await withTestTransaction(async (tx) => {
      const novo = await repo.create({ pais: 'Teste', sigla: 'TS', ddi: '+00', moeda: 'TST' }, 1, tx);
      expect(novo.codPais).toBeDefined();
      const achado = await repo.findById(novo.codPais, tx);
      expect(achado?.sigla).toBe('TS');
    });
  });

  it('remove faz soft delete (isActive=false) dentro da transação', async () => {
    await withTestTransaction(async (tx) => {
      const novo = await repo.create({ pais: 'Tmp', sigla: 'TZ' }, 1, tx);
      await repo.remove(novo.codPais, 1, tx);
      const achado = await repo.findById(novo.codPais, tx); // findById filtra isActive
      expect(achado).toBeNull();
    });
  });
});
```

> **Ciclo TDD por método:** escreva o teste do service (Red), implemente repo+service (Green),
> refatore; só então monte controller/rota e seu teste. Rode `npm test` a cada passo.
> Mapeia T-040 (passos 1–3 leitura + testes), T-041 (create/update + testes), T-042 (delete RN002).

---

## A2. Estados

Idêntico a Países, com **filtro opcional por país** na listagem e **pré-checagem da FK** no service.

### `modules/estados/estados.schema.ts`
```ts
import { z } from 'zod';

export const createEstadoSchema = z.object({
  codPais: z.coerce.number({ message: 'O país é obrigatório.' }).int().positive(),
  uf: z.string().trim().length(2, 'A UF deve ter 2 caracteres.'),
  estado: z.string().trim().min(1, 'Informe o nome do estado.').max(22),
});
export const updateEstadoSchema = createEstadoSchema;
export type CreateEstadoInput = z.infer<typeof createEstadoSchema>;
export type UpdateEstadoInput = z.infer<typeof updateEstadoSchema>;
```

### `estados.repository.ts` — listagem com filtro (fragmento condicional) + hasDependents
```ts
import type postgres from 'postgres';
import sql from '../../lib/db';
import type Estados from '../../db/types/public/Estados';
import type { CreateEstadoInput, UpdateEstadoInput } from './estados.schema';

export class EstadosRepository {
  async list(limit: number, afterId = 0, codPais?: number, tx?: postgres.TransactionSql): Promise<Estados[]> {
    const client = tx ?? sql;
    return client<Estados[]>`
      SELECT *
      FROM   "Estados"
      WHERE  "isActive" = true
        AND  "codEstado" > ${afterId}
        ${codPais ? client`AND "codPais" = ${codPais}` : client``}
      ORDER BY "codEstado"
      LIMIT  ${limit}
    `;
  }

  async findById(id: number, tx?: postgres.TransactionSql): Promise<Estados | null> {
    const client = tx ?? sql;
    const [row] = await client<Estados[]>`
      SELECT * FROM "Estados" WHERE "codEstado" = ${id} AND "isActive" = true
    `;
    return row ?? null;
  }

  async create(d: CreateEstadoInput, codUser: number, tx?: postgres.TransactionSql): Promise<Estados> {
    const client = tx ?? sql;
    const [row] = await client<Estados[]>`
      INSERT INTO "Estados" ("codPais", "uf", "estado", "codUser")
      VALUES (${d.codPais}, ${d.uf}, ${d.estado}, ${codUser})
      RETURNING *
    `;
    return row;
  }

  async update(id: number, d: UpdateEstadoInput, codUser: number, tx?: postgres.TransactionSql): Promise<Estados | null> {
    const client = tx ?? sql;
    const [row] = await client<Estados[]>`
      UPDATE "Estados"
      SET    "codPais" = ${d.codPais}, "uf" = ${d.uf}, "estado" = ${d.estado},
             "codUser" = ${codUser}, "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codEstado" = ${id} AND "isActive" = true
      RETURNING *
    `;
    return row ?? null;
  }

  async remove(id: number, codUser: number, tx?: postgres.TransactionSql): Promise<{ codEstado: number } | null> {
    const client = tx ?? sql;
    const [row] = await client<{ codEstado: number }[]>`
      UPDATE "Estados" SET "isActive" = false, "codUser" = ${codUser}, "dtEdicao" = CURRENT_TIMESTAMP
      WHERE "codEstado" = ${id} AND "isActive" = true RETURNING "codEstado"
    `;
    return row ?? null;
  }

  async hasDependents(id: number, tx?: postgres.TransactionSql): Promise<boolean> {
    const client = tx ?? sql;
    const [row] = await client`
      SELECT 1 FROM "Cidades"  WHERE "codEstado" = ${id} AND "isActive" = true
      UNION ALL
      SELECT 1 FROM "Veiculos" WHERE "codEstado" = ${id} AND "isActive" = true
      LIMIT 1
    `;
    return !!row;
  }
}
```

### `estados.service.ts` — pré-checa o país (mensagem clara em vez do 409 genérico de FK)
```ts
import { AppError } from '../../shared/errors/AppError';
import { EstadosRepository } from './estados.repository';
import { PaisesRepository } from '../paises/paises.repository';
import type { CreateEstadoInput, UpdateEstadoInput } from './estados.schema';

export class EstadosService {
  constructor(
    private readonly repo: EstadosRepository = new EstadosRepository(),
    private readonly paisesRepo: PaisesRepository = new PaisesRepository(),
  ) {}

  async listEstados(limit = 50, afterId = 0, codPais?: number) {
    return this.repo.list(limit, afterId, codPais);
  }

  async getEstado(id: number) {
    const estado = await this.repo.findById(id);
    if (!estado) throw new AppError('Estado não encontrado.', 404);
    return estado;
  }

  async createEstado(data: CreateEstadoInput, codUser: number) {
    await this.assertPais(data.codPais);
    return this.repo.create(data, codUser);
  }

  async updateEstado(id: number, data: UpdateEstadoInput, codUser: number) {
    await this.assertPais(data.codPais);
    const atualizado = await this.repo.update(id, data, codUser);
    if (!atualizado) throw new AppError('Estado não encontrado.', 404);
    return atualizado;
  }

  async removeEstado(id: number, codUser: number) {
    if (!(await this.repo.findById(id))) throw new AppError('Estado não encontrado.', 404);
    if (await this.repo.hasDependents(id)) {
      throw new AppError('Não é possível excluir: há cidades ou veículos vinculados a este estado.', 409);
    }
    await this.repo.remove(id, codUser);
  }

  private async assertPais(codPais: number) {
    if (!(await this.paisesRepo.findById(codPais))) {
      throw new AppError('País informado não existe.', 400);
    }
  }
}
```

Controller/routes/`app.use('/api/estados', ...)` análogos a Países; o controller lê o filtro:
```ts
const codPais = req.query.codPais ? Number(req.query.codPais) : undefined;
res.status(200).json(await this.service.listEstados(limit, afterId, codPais));
```
Testes (service mockando `EstadosRepository` **e** `PaisesRepository`): cobrir 404, RN002
(bloqueio com cidades ou veículos), e `createEstado` lançando 400 quando país inexistente. Mapeia T-043/044/045.

---

## A3. Cidades

Análogo a Estados, com pré-checagem do **estado** e `hasDependents` em **três** tabelas.

### `cidades.schema.ts`
```ts
import { z } from 'zod';

export const createCidadeSchema = z.object({
  codEstado: z.coerce.number({ message: 'O estado é obrigatório.' }).int().positive(),
  cidade: z.string().trim().min(1, 'Informe o nome da cidade.').max(32),
  ddd: z.string().trim().length(2, 'O DDD deve ter 2 dígitos.').optional(),
});
export const updateCidadeSchema = createCidadeSchema;
export type CreateCidadeInput = z.infer<typeof createCidadeSchema>;
export type UpdateCidadeInput = z.infer<typeof updateCidadeSchema>;
```

### `cidades.repository.ts` — `hasDependents` em Clientes/Fornecedores/Transportadoras
```ts
async hasDependents(id: number, tx?: postgres.TransactionSql): Promise<boolean> {
  const client = tx ?? sql;
  const [row] = await client`
    SELECT 1 FROM "Clientes"        WHERE "codCidade" = ${id} AND "isActive" = true
    UNION ALL
    SELECT 1 FROM "Fornecedores"    WHERE "codCidade" = ${id} AND "isActive" = true
    UNION ALL
    SELECT 1 FROM "Transportadoras" WHERE "codCidade" = ${id} AND "isActive" = true
    LIMIT 1
  `;
  return !!row;
}
```
(demais métodos: `list(limit, afterId, codEstado?)`, `findById`, `create`, `update`, `remove`
seguem o mesmo molde de Estados, trocando colunas para `codEstado`/`cidade`/`ddd`.)

### `cidades.service.ts` — pré-checa o estado; bloqueio RN002
```ts
async removeCidade(id: number, codUser: number) {
  if (!(await this.repo.findById(id))) throw new AppError('Cidade não encontrada.', 404);
  if (await this.repo.hasDependents(id)) {
    throw new AppError('Não é possível excluir: há clientes, fornecedores ou transportadoras vinculados a esta cidade.', 409);
  }
  await this.repo.remove(id, codUser);
}
private async assertEstado(codEstado: number) {
  if (!(await this.estadosRepo.findById(codEstado))) throw new AppError('Estado informado não existe.', 400);
}
```
Controller/routes/`app.use('/api/cidades', ...)` e testes análogos. Mapeia T-046/047/048.

---

# PARTE B — EP-11 (concluir bootstrap do frontend)

Já instalado: Vite, React 19, TS, styled-components, axios. **Falta** instalar e configurar:

> ⚠️ Resolvido: a nota de TailwindCSS do T-110 foi corrigida no Backlog → a estilização é
> **styled-components** (o CLAUDE.md proíbe Tailwind).

### Passo B1 — instalar libs da stack oficial
```bash
cd Frontend && npm i react-router-dom @tanstack/react-table
```

### Passo B2 — `src/services/api.tsx` (corrigir env + interceptor de erro PT)
```tsx
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const mensagem = error.response?.data?.mensagem ?? 'Erro de comunicação com o servidor.';
    return Promise.reject(new Error(mensagem));
  },
);

export default api;
```
`.env` e `.env.example`: `VITE_API_URL=http://localhost:3000` (o prefixo `VITE_` é obrigatório).

### Passo B3 — `src/themes/index.ts` (tokens)
```ts
export const theme = {
  cores: { primaria: '#1f6feb', texto: '#1c2128', fundo: '#ffffff', borda: '#d0d7de', erro: '#cf222e' },
  espacamento: { sm: '8px', md: '16px', lg: '24px' },
  tipografia: { base: "16px/1.5 'Segoe UI', system-ui, sans-serif" },
};
export type Theme = typeof theme;
```

### Passo B4 — shell de layout `src/components/layout/index.tsx`
```tsx
import { NavLink } from 'react-router-dom';
import { Shell, Sidebar, Conteudo } from './style';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <Sidebar>
        <h1>SI João Bail</h1>
        <nav>
          <NavLink to="/paises">Países</NavLink>
          <NavLink to="/estados">Estados</NavLink>
          <NavLink to="/cidades">Cidades</NavLink>
        </nav>
      </Sidebar>
      <Conteudo>{children}</Conteudo>
    </Shell>
  );
}
```
`src/components/layout/style.ts` com styled-components responsivo (sidebar vira topo no mobile).

### Passo B5 — `src/main.tsx` (router + theme + layout)
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import MainGlobalStyles from './styles/globalStyles';
import { theme } from './themes';
import Layout from './components/layout';
import PaisesPage from './pages/paises';
import EstadosPage from './pages/estados';
import CidadesPage from './pages/cidades';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <MainGlobalStyles />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/paises" replace />} />
            <Route path="/paises" element={<PaisesPage />} />
            <Route path="/estados" element={<EstadosPage />} />
            <Route path="/cidades" element={<CidadesPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
```
(T-111 estado global: um `src/contexts/FeedbackContext.tsx` simples para mensagens de erro/sucesso
pode ser adicionado e consumido pelas páginas — opcional nesta fase.)

---

# PARTE C — Frontend T-113 (telas geográficas)

Por entidade: **listar primeiro** (TanStack Table), depois **formulário** C/U/D.

### Passo C1 — serviço de domínio `src/services/paises.ts`
```ts
import api from './api';

export interface Pais {
  codPais: number; pais: string; sigla: string; ddi: string | null; moeda: string | null;
}

export const paisesService = {
  listar: () => api.get<Pais[]>('/api/paises').then((r) => r.data),
  obter: (id: number) => api.get<Pais>(`/api/paises/${id}`).then((r) => r.data),
  criar: (d: Partial<Pais>) => api.post<Pais>('/api/paises', d).then((r) => r.data),
  atualizar: (id: number, d: Partial<Pais>) => api.put<Pais>(`/api/paises/${id}`, d).then((r) => r.data),
  remover: (id: number) => api.delete(`/api/paises/${id}`),
};
```
(`estados.ts` e `cidades.ts` análogos; `estadosService.listar(codPais?)` e
`cidadesService.listar(codEstado?)` montam `?codPais=`/`?codEstado=` para os selects.)

### Passo C2 — página de listagem `src/pages/paises/index.tsx` (TanStack Table)
```tsx
import { useEffect, useMemo, useState } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { paisesService, type Pais } from '../../services/paises';
import { Tabela, Toolbar, Botao } from './style';
import PaisForm from './PaisForm';

const col = createColumnHelper<Pais>();

export default function PaisesPage() {
  const [dados, setDados] = useState<Pais[]>([]);
  const [editando, setEditando] = useState<Pais | null>(null);
  const [erro, setErro] = useState('');

  const carregar = () => paisesService.listar().then(setDados).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);

  const excluir = async (id: number) => {
    try { await paisesService.remover(id); carregar(); }
    catch (e) { setErro((e as Error).message); } // exibe o 409 RN002 em PT
  };

  const columns = useMemo(() => [
    col.accessor('pais', { header: 'País' }),
    col.accessor('sigla', { header: 'Sigla' }),
    col.accessor('ddi', { header: 'DDI' }),
    col.display({
      id: 'acoes', header: 'Ações',
      cell: ({ row }) => (
        <>
          <button onClick={() => setEditando(row.original)}>Editar</button>
          <button onClick={() => excluir(row.original.codPais)}>Excluir</button>
        </>
      ),
    }),
  ], []);

  const table = useReactTable({ data: dados, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  return (
    <section>
      <Toolbar>
        <h2>Países</h2>
        <Botao onClick={() => setEditando({} as Pais)}>Novo país</Botao>
      </Toolbar>
      {erro && <p role="alert">{erro}</p>}
      <Tabela>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>{hg.headers.map((h) => (
              <th key={h.id} onClick={h.column.getToggleSortingHandler()}>
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}</tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id}>{r.getVisibleCells().map((c) => (
              <td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
            ))}</tr>
          ))}
        </tbody>
      </Tabela>
      {editando && (
        <PaisForm
          inicial={editando}
          onSalvo={() => { setEditando(null); carregar(); }}
          onCancelar={() => setEditando(null)}
        />
      )}
    </section>
  );
}
```

### Passo C3 — formulário `src/pages/paises/PaisForm.tsx`
```tsx
import { useState } from 'react';
import { paisesService, type Pais } from '../../services/paises';

export default function PaisForm({ inicial, onSalvo, onCancelar }: {
  inicial: Partial<Pais>; onSalvo: () => void; onCancelar: () => void;
}) {
  const [form, setForm] = useState<Partial<Pais>>(inicial);
  const [erro, setErro] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (inicial.codPais) await paisesService.atualizar(inicial.codPais, form);
      else await paisesService.criar(form);
      onSalvo();
    } catch (err) { setErro((err as Error).message); }
  };

  return (
    <form onSubmit={submit}>
      {erro && <p role="alert">{erro}</p>}
      <input placeholder="País" value={form.pais ?? ''} onChange={(e) => setForm({ ...form, pais: e.target.value })} required maxLength={6} />
      <input placeholder="Sigla" value={form.sigla ?? ''} onChange={(e) => setForm({ ...form, sigla: e.target.value })} required maxLength={3} />
      <input placeholder="DDI" value={form.ddi ?? ''} onChange={(e) => setForm({ ...form, ddi: e.target.value })} maxLength={4} />
      <input placeholder="Moeda" value={form.moeda ?? ''} onChange={(e) => setForm({ ...form, moeda: e.target.value })} maxLength={3} />
      <button type="submit">Salvar</button>
      <button type="button" onClick={onCancelar}>Cancelar</button>
    </form>
  );
}
```

### Passo C4 — Estados e Cidades
Replicar C2/C3 em `src/pages/estados/` e `src/pages/cidades/`. Diferença: o formulário tem um
`<select>` do pai (país em Estados; estado em Cidades) populado por `estadosService`/`cidadesService`
e por `paisesService`/`estadosService`. As listagens podem filtrar pelo pai via o mesmo serviço.

---

# Verificação

**Backend** (`/Backend`, Postgres rodando: `brew services start postgresql@16`):
- `npm test` — todos verdes (service unit + rotas supertest + repository rollback).
- `npm run typecheck` e `npm run lint` sem erros.
- `npm run seed`; `npm run dev` e validar manual: `GET /api/paises`, `GET /api/paises/1`,
  `POST/PUT/DELETE`, e **RN002**: excluir Brasil (com estados) → 409 PT; estado com cidades → 409;
  cidade com cliente/fornecedor/transportadora → 409. Conferir resposta < 2s (RNF02).

**Frontend** (`/Frontend`): `npm run dev`; navegar pelo menu; listar/criar/editar/excluir nas três
telas; confirmar mensagens PT de validação e de RN002.

# Atualização de docs (ao concluir)
- Marcar `[x]` T-040–T-048, T-110/111/112, T-113 em `docs/11-backlog.md`; corrigir nota de Tailwind do T-110.
- Atualizar "Estado atual" do `CLAUDE.md` (EP-04 concluída; próximo = EP-05).
- Sincronizar 05/06/07 se algum campo/regra divergir.
