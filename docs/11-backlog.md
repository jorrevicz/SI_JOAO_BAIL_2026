# 11 — Backlog (Épicos e Tasks)

Passo-a-passo de desenvolvimento do sistema, organizado em **épicos** (`EP-NN`) e
**tasks** (`T-NNN`). Traduz o [Roadmap](09-roadmap.md) e o
[Modelo de Domínio](05-modelo-de-dominio.md) em itens acionáveis.

## Como usar

- Execute os épicos **em ordem**: EP-00 → EP-03, depois **EP-13** (transição da camada de
  dados), e então EP-04 → EP-09. EP-12 é contínuo/transversal; EP-10/EP-11 conforme suas notas.
  **Concluídos até aqui:** EP-00→EP-03, EP-13, EP-11 (bootstrap do frontend) e EP-04 (backend
  e telas geográficas). **Foco atual:** EP-05 (Catálogo).
- Dentro de um CRUD, siga sempre **consultas (Read) primeiro**, depois Create/Update/Delete.
- Marque `[x]` ao concluir. Uma task só está "pronta" quando seus **critérios de aceite**
  passam (inclui testes Vitest quando aplicável).
- Regras transversais sempre valem: **RN001** (autenticação), **RN002** (não excluir com
  dependentes) — ver [Casos de Uso](07-casos-de-uso.md#regras-de-negócio-transversais).

### Padrão de CRUD (referência para EP-04 a EP-09)

Para cada entidade, na ordem:

1. **Consulta** — repository + service (listar + obter por id).
2. **GET** — controller + rotas `GET /api/<recurso>` e `GET /api/<recurso>/:id`.
3. **Testes de consulta** (Vitest).
4. **Create** — validação de payload + service + `POST`.
5. **Update** — `PUT /api/<recurso>/:id`.
6. **Delete** — `DELETE` com RN002 (bloquear se houver dependentes) via **soft delete** (`isActive = false`).
7. **Testes de C/U/D** (Vitest).

Toda escrita registra auditoria (`codUser`, `dtCriacao`/`dtEdicao`) — ver
[Segurança](08-seguranca-e-autenticacao.md#auditoria).

---

## EP-00 — Fundação do projeto
**Fase:** 0 · **Docs:** [Arquitetura](02-arquitetura.md), [Stack](03-stack-tecnologica.md)
**Objetivo:** repositório e tooling prontos para desenvolver backend-first.

- [x] **T-001 — Estrutura de diretórios**
  - Criar `/Backend/src/db`, `/Backend/src`, `/Frontend/src` conforme [Arquitetura](02-arquitetura.md#estrutura-de-diretórios-raiz-do-projeto).
  - **Aceite:** árvore de pastas existe; `.gitignore` cobre `node_modules`, `.env`, build.
  - **Dependências:** —

- [x] **T-002 — Inicializar backend (Node + TypeScript)**
  - `npm init`, instalar TypeScript, `tsconfig.json` estrito, `ts-node`/`tsx` para dev.
  - **Aceite:** `npx tsc --noEmit` roda sem erro num arquivo de exemplo; script `dev` definido.
  - **Dependências:** T-001

- [x] **T-003 — Express + estrutura de app**
  - Instalar Express; criar `src/app.ts` (instância) e `src/server.ts` (bootstrap); rota `GET /health`.
  - **Aceite:** `npm run dev` sobe o servidor; `GET /health` retorna `200`.
  - **Dependências:** T-002

- [x] **T-004 — Lint, format e convenções**
  - ESLint + Prettier (clean code — RNF11); padronizar idioma de identificadores (decisão do [CLAUDE.md](../CLAUDE.md)).
  - **Aceite:** `npm run lint` passa; regras documentadas no README do backend.
  - **Dependências:** T-002

- [x] **T-005 — Configurar Vitest**
  - Instalar e configurar Vitest no backend; teste smoke (`GET /health`).
  - **Aceite:** `npm test` executa e o teste de health passa.
  - **Dependências:** T-003

- [x] **T-006 — Atualizar a seção "Comandos" do [CLAUDE.md](../CLAUDE.md)**
  - Substituir o placeholder pelos scripts reais (dev, test, lint, migrate, seed).
  - **Aceite:** comandos do CLAUDE.md correspondem ao `package.json`.
  - **Dependências:** T-002, T-005

---

## EP-01 — Modelagem do banco (3FN)
**Fase:** 0 · **Docs:** [Modelo de Dados](06-modelo-de-dados.md), [Modelo de Domínio](05-modelo-de-dominio.md)
**Objetivo:** schema relacional normalizado, fonte de verdade do banco.

> ⚠️ **Stack atualizada:** este épico foi concluído com **Prisma**. A camada de dados
> migrou para **postgres.js + node-pg-migrate + kanel** — ver
> [EP-13](#ep-13--transição-da-camada-de-dados-prisma--postgresjs). O schema (tabelas, PKs/FKs,
> 3FN) permanece válido; muda a ferramenta que o materializa (migrations SQL em vez de `schema.prisma`).

- [x] **T-010 — Configurar Prisma + Local Prisma Postgres**
  - Instalar Prisma; `schema.prisma` em `/Backend/src/db`; `DATABASE_URL` em `.env`.
  - **Aceite:** `npx prisma validate` ok; conexão com o Postgres local funciona.
  - **Dependências:** T-002

- [x] **T-011 — Modelar entidades-base e auditoria**
  - Modelar `Users` e o padrão de auditoria (`codUser`, `dtCriacao`, `dtEdicao`, `isActive`) reutilizável.
  - Corrigir grafias do diagrama (`tenha`→`senha` etc.) conforme [CLAUDE.md](../CLAUDE.md#convenções-de-nomenclatura).
  - **Aceite:** modelos compilam; `codUser` é FK opcional para `Users` (auth adiada — EP-10).
  - **Dependências:** T-010

- [x] **T-012 — Modelar subdomínios geográfico, parceiros e catálogo**
  - `Paises`, `Estados`, `Cidades`, `Fornecedores`, `Clientes`, `Transportadoras`, `Veiculos`, `Produtos`, `Categorias` (a tabela `NCM_SH`, inicialmente modelada, foi **removida** — classificação fiscal fora de escopo).
  - Associativas N:N **puras** (sem colunas redundantes): `ProdutoFornecedor`, `ProdutoCategoria` — ver [pendências de normalização](06-modelo-de-dados.md#princípios-de-modelagem).
  - **Aceite:** relações conferem com [Modelo de Dados](06-modelo-de-dados.md#tabelas-e-chaves); 3FN respeitada.
  - **Dependências:** T-011

- [x] **T-013 — Modelar financeiro, compras e fiscal**
  - `CondicaoDePagamento`, `FormaDePagamento`, `Parcelas`, `ContasAPagar`, `ContasAReceber`, `Compras`, `CompraProduto`, `NotasFiscaisEletronicas`, `ProdutoNfe`, `VeiculoNfe`.
  - **Aceite:** FKs e associativas conforme docs; campos fiscais presentes ([Glossário](10-glossario.md)).
  - **Dependências:** T-012

- [x] **T-014 — Política de exclusão e migration inicial**
  - Definir `onDelete: Restrict` nas FKs e/ou soft delete (`isActive`) — RN002.
  - `npx prisma migrate dev --name init`.
  - **Aceite:** migration aplicada; tabelas criadas no banco; cliente Prisma gerado.
  - **Dependências:** T-013

---

## EP-02 — Scripts de seed
**Fase:** 0 · **Docs:** [Modelo de Dados](06-modelo-de-dados.md#scripts-de-seed), [Roadmap](09-roadmap.md)
**Objetivo:** popular o banco respeitando dependências.

> ⚠️ **Stack atualizada:** o seed foi escrito com o cliente Prisma (`upsert`). Será reescrito
> com **postgres.js** (`INSERT ... ON CONFLICT`) mantendo a idempotência — ver
> [T-135](#ep-13--transição-da-camada-de-dados-prisma--postgresjs).

- [x] **T-020 — Infra de seed**
  - `prisma/seed.ts` + `prisma.seed` no `package.json`; idempotente (`upsert`).
  - **Aceite:** `npx prisma db seed` roda sem erro e pode rodar 2× sem duplicar.
  - **Dependências:** T-014

- [x] **T-021 — Seed geográfico**
  - Brasil → Estados (UFs) → algumas Cidades (na ordem de dependência).
  - **Aceite:** consultas retornam países/estados/cidades coerentes.
  - **Dependências:** T-020

- [x] **T-022 — Seed de catálogo e parceiros (amostra)**
  - Categorias, alguns Produtos; 1–2 Fornecedores, Clientes, Transportadoras, Veículos.
  - **Aceite:** dados de amostra suficientes para testar os CRUDs das Fases 1–2.
  - **Dependências:** T-021

---

## EP-03 — Arquitetura base do backend
**Fase:** 0/1 · **Docs:** [Arquitetura](02-arquitetura.md), [Segurança](08-seguranca-e-autenticacao.md)
**Objetivo:** esqueleto em camadas reutilizável por todos os módulos.

> ⚠️ **Stack atualizada:** o wrapper de transação (T-032) e a instância de banco foram feitos
> sobre Prisma (`prisma.$transaction`, `PrismaClient`). Serão reescritos sobre **postgres.js**
> (`sql.begin`, instância `sql`) sem mudar o contrato das camadas — ver
> [EP-13](#ep-13--transição-da-camada-de-dados-prisma--postgresjs).

- [x] **T-030 — Camadas e organização por módulo**
  - Estrutura `routes → controllers → services → repositories`; um módulo por subdomínio.
  - **Aceite:** módulo de exemplo segue o padrão; Prisma isolado na camada de repositório.
  - **Dependências:** T-003, T-010

- [x] **T-031 — Tratamento de erros e respostas padrão**
  - Middleware de erro central; formato JSON de erro/sucesso; **mensagens em português** (RNF07).
  - **Aceite:** erros retornam status + mensagem PT consistentes; 404 e 400 tratados.
  - **Dependências:** T-030

- [x] **T-032 — Wrapper de transação (atomicidade)**
  - Helper sobre `prisma.$transaction` para operações críticas (RNF06).
  - **Aceite:** falha no meio de uma operação multi-tabela faz rollback total (teste).
  - **Dependências:** T-030

- [x] **T-033 — Middleware de autenticação (stub)**
  - Stub que injeta `codUser` (auth real em EP-10); ponto único para ativar RN001/RNF03.
  - **Aceite:** rotas passam por ele; troca para auth real será localizada.
  - **Dependências:** T-030

- [x] **T-034 — Validação de entrada**
  - Adotar validador (ex.: Zod) e padrão de validação por rota (proteção de entrada — RNF05).
  - Helper `validate(schema)` em `src/shared/validation/validate.ts`; testes Vitest cobrindo payload válido, campo ausente e tipo inválido.
  - **Aceite:** payload inválido retorna 400 com mensagem PT clara.
  - **Dependências:** T-031

---

## EP-13 — Transição da camada de dados (Prisma → postgres.js) ✓ concluído
**Fase:** 0 · **Docs:** [Stack](03-stack-tecnologica.md), [Arquitetura](02-arquitetura.md#acesso-a-dados-postgresjs), [Segurança](08-seguranca-e-autenticacao.md)
**Objetivo:** substituir o Prisma por **postgres.js** (acesso a dados), **node-pg-migrate**
(migrations SQL) e **kanel** (tipos), preservando ACID (RNF06), proteção contra SQLi (RNF05),
soft-delete, auditoria e paginação por cursor.

> **Executado antes do EP-04** — todos os CRUDs (EP-04+) seguem o
> [padrão de repository com postgres.js](02-arquitetura.md#acesso-a-dados-postgresjs).
> Numerado como EP-13 (concebido após o EP-12), mas foi o épico executado logo após a Fase 0,
> quando ainda não havia nenhum CRUD construído — só o módulo `health`.

- [X] **T-130 — Dependências e scripts**
  - Adicionar `postgres`, `node-pg-migrate`; `kanel` (+ `kanel-zod`) como devDependencies.
  - Remover do `package.json` o bloco `"prisma"` e os scripts `prisma migrate`/`db seed`.
  - Novos scripts: `migrate` (`node-pg-migrate up`), `migrate:down`, `migrate:create`,
    `types:gen` (`kanel`), `seed` (`tsx src/db/seed.ts`).
  - **Aceite:** `npm install` ok; `npm run` lista os novos scripts; sem dependência Prisma.
  - **Dependências:** —

- [X] **T-131 — Cliente postgres.js compartilhado**
  - Criar `src/lib/db.ts` exportando a instância única `sql` (ssl por ambiente, `max` pequeno,
    `idle_timeout`, `connect_timeout`, `statement_timeout` apoiando RNF02). Remover `src/lib/prisma.ts`.
  - Encerramento gracioso (`sql.end`) em `SIGTERM`/`SIGINT` no `src/server.ts`.
  - **Aceite:** app sobe com o novo cliente; `GET /health` responde; shutdown drena conexões.
  - **Dependências:** T-130

- [X] **T-132 — Wrapper de transação via `sql.begin` (RNF06)**
  - Reescrever `src/shared/transaction/withTransaction.ts` para `sql.begin`, mantendo a
    assinatura (callback recebe o handle transacional). Reescrever `withTransaction.test.ts`.
  - **Aceite:** falha no meio de uma operação multi-tabela faz rollback total (teste passa).
  - **Dependências:** T-131

- [X] **T-133 — Migration baseline (node-pg-migrate)**
  - Migration inicial reaproveitando o DDL existente (tabelas, PKs/FKs `ON DELETE RESTRICT`,
    `VARCHAR(n)`, `CHAR(44)`, `DECIMAL`). Acrescentar `DEFAULT CURRENT_TIMESTAMP` em `dtEdicao`
    (o `@updatedAt` do Prisma deixa de existir). Remover `DB/schema.prisma` e `prisma.config.ts`.
  - **Aceite:** `npm run migrate` cria todas as tabelas num banco limpo; constraints conferem (`\d+`).
  - **Dependências:** T-130

- [X] **T-134 — Geração de tipos (kanel)**
  - `kanel.config.js` apontando para o banco; saída em `src/db/types`. Rodar após cada migration.
  - **Aceite:** `npm run types:gen` gera as interfaces; `npm run typecheck` passa.
  - **Dependências:** T-133

- [X] **T-135 — Reescrever o seed com postgres.js (idempotente)**
  - `src/db/seed.ts` com `INSERT ... ON CONFLICT DO NOTHING/UPDATE`, mesma ordem de dependências e
    mesmos dados (dígitos puros). Usa a instância `sql`.
  - **Aceite:** `npm run seed` roda 2× sem duplicar; contagens batem com o estado atual do seed.
  - **Dependências:** T-133

- [X] **T-136 — Mapear erros do Postgres + helper de teste de repositório**
  - No `errorHandler`, converter códigos PG (`23505` unique → 409, `23503` FK/RN002 → 409) em
    `AppError` com mensagem PT. Criar helper `src/__tests__/helpers/db-helper.ts` para testes de
    integração de repositório com **transação revertida** (rollback) por teste.
  - **Aceite:** violação de unique/FK retorna 409 PT; teste-piloto de repo (commit e rollback) passa.
  - **Dependências:** T-131, T-132

- [X] **T-137 — Fixar o padrão de repository (template para EP-04+)**
  - Documentar/validar num repo de exemplo as convenções: valores por `${}`, identificadores
    por whitelist `sql()`, filtro `isActive = true`, soft delete, auditoria, cursor sobre `codX`.
  - **Aceite:** exemplo segue [Acesso a dados](02-arquitetura.md#acesso-a-dados-postgresjs); serve de molde ao EP-04.
  - **Dependências:** T-134, T-136

- [X] **T-138 — Sincronizar documentação**
  - Atualizar `docs/` (02, 03, 06, 08, 09, 10), `README.md` e `CLAUDE.md` para a nova stack.
  - **Aceite:** nenhuma referência a Prisma como ferramenta ativa; `docs/` fiéis ao código.
  - **Dependências:** T-130

---

## EP-04 — Cadastros geográficos (Lote 1) ✓ concluído
**Fase:** 1 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-países), [Domínio](05-modelo-de-dominio.md#1-localização-geografia)
**Objetivo:** primeiros CRUDs, pré-requisito de todos os demais. Entidades: **Países, Estados, Cidades**.

> Aplicado o [Padrão de CRUD](#padrão-de-crud-referência-para-ep-04-a-ep-09) a cada entidade.
> Backend (T-040–T-049) e telas (T-113) concluídos. A validação de formulários segue o contrato
> **backend-driven** (resposta 400 com `erros: { campo: mensagem }`) — ver
> [decisão de validação](ref/validacao-frontend-backend-driven.md).

- [X] **T-040 — Países: consultas (Read)** — listar + obter por id; `GET /api/paises[/:id]`; testes.
  - **Aceite:** lista e item retornam 200; tempo de resposta < 2s (RNF02). **Dep:** EP-03, EP-13, T-021
- [X] **T-041 — Países: Create/Update** — `POST`/`PUT` com validação. **Aceite:** cria/edita país válido; 400 em payload inválido. **Dep:** T-040
- [X] **T-042 — Países: Delete (RN002)** — soft delete; **bloquear** se houver Estados vinculados. **Aceite:** excluir país com estado retorna erro PT; sem dependentes inativa. **Dep:** T-041
- [X] **T-043 — Estados: consultas** — `GET /api/estados[/:id]`, filtro por país; testes. **Dep:** T-040
- [X] **T-044 — Estados: Create/Update** — valida FK país. **Dep:** T-043
- [X] **T-045 — Estados: Delete (RN002)** — bloquear se houver Cidades/Fornecedores vinculados. **Dep:** T-044
- [X] **T-046 — Cidades: consultas** — `GET /api/cidades[/:id]`, filtro por estado; testes. **Dep:** T-043
- [X] **T-047 — Cidades: Create/Update** — valida FK estado. **Dep:** T-046
- [X] **T-048 — Cidades: Delete (RN002)** — bloquear se houver Clientes/Fornecedores/Transportadoras vinculados. **Dep:** T-047
- [x] **T-049 — Índices únicos geográficos** — migration `unique-ddi-uf`: `Paises(ddi)` único e
  `Estados(codPais, uf)` único; `errorHandler` mapeia `23505` → 409 PT ("DDI já cadastrado",
  "UF já cadastrada para este país"). **Aceite:** DDI/UF duplicados retornam 409 com mensagem por campo. **Dep:** T-040, T-043

### Frontend — concluído após T-049

- [x] **T-113 — Telas geográficas** — listar e gerenciar Países, Estados e Cidades (listagem
  TanStack Table, navegação hierárquica por query params, formulários em modal; validação
  backend-driven por campo). **Dep:** T-049, EP-11 (T-112)

---

## EP-05 — Catálogo de produtos (Lote 2A)
**Fase:** 2 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-produtos), [Domínio](05-modelo-de-dominio.md#3-produtos-e-catálogo)
**Objetivo:** Entidades: **Categorias, Produtos** (RN003: vincular categorias e fornecedores ao produto).

> A entidade **NCM/SH foi descartada** (classificação fiscal/tributária fora de escopo); Produtos
> não têm `codNcmSH`. Ver [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem).

- [ ] **T-050 — Categorias: consultas** — `GET /api/categorias[/:id]`; testes. **Dep:** EP-03, T-022
- [ ] **T-051 — Categorias: Create/Update.** **Dep:** T-050
- [ ] **T-052 — Categorias: Delete (RN002)** — bloquear se vinculada a produtos. **Dep:** T-051
- [ ] **T-056 — Produtos: consultas** — `GET /api/produtos[/:id]`; incluir categoria; filtros; testes.
  - **Aceite:** retorna produto com categoria resolvida. **Dep:** T-050
- [ ] **T-057 — Produtos: Create/Update (RN003)** — vincular `codCategoria`; vínculo Produto↔Fornecedor (`ProdutoFornecedor`).
  - **Aceite:** cria produto com categoria; vincula fornecedor. **Dep:** T-056
- [ ] **T-058 — Produtos: Delete (RN002)** — bloquear se em compras/fornecedores/notas. **Dep:** T-057

### Frontend — executar após T-058 completo

- [ ] **T-114A — Telas de catálogo** — listar e gerenciar Categorias e Produtos; incluir vínculos de categoria. **Dep:** T-058, EP-11 (T-112)

---

## EP-06 — Parceiros (Lote 2B)
**Fase:** 2 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-fornecedores), [Domínio](05-modelo-de-dominio.md#2-parceiros-de-negócio)
**Objetivo:** Entidades: **Fornecedores, Clientes, Transportadoras** (+ **Veículos**, RF04). Todos referenciam Cidade (EP-04).

- [ ] **T-060 — Fornecedores: consultas** — `GET /api/fornecedores[/:id]`; testes. **Dep:** EP-04 (T-046)
- [ ] **T-061 — Fornecedores: Create/Update** — valida FK cidade, CPF/CNPJ. **Dep:** T-060
- [ ] **T-062 — Fornecedores: Delete (RN002)** — bloquear se em produtos/contas a pagar/notas. **Dep:** T-061
- [ ] **T-063 — Fornecedores: listagens** — `listarProdutosFornecedor`, `listarContasPagarFornecedor` (rotas de consulta). **Dep:** T-060
- [ ] **T-064 — Clientes: consultas** — `GET /api/clientes[/:id]`; incluir cidade e condição de pagamento; testes. **Dep:** EP-04 (T-046)
- [ ] **T-065 — Clientes: Create/Update** — valida FK cidade e `cond_pag_id`. **Dep:** T-064
- [ ] **T-066 — Clientes: Delete (RN002)** — bloquear se em contas a receber/compras. **Dep:** T-065
- [ ] **T-067 — Veículos: consultas** — `GET /api/veiculos[/:id]`; testes. **Dep:** EP-04 (T-043)
- [ ] **T-068 — Veículos: Create/Update/Delete (RN002)** — bloquear se em transportadoras/notas. **Dep:** T-067
- [ ] **T-069 — Transportadoras: CRUD completo** — consultas → C/U/D; `consultarVeiculos`; Delete bloqueado se em veículos/notas. **Dep:** T-067

### Frontend — executar após T-069 completo

- [ ] **T-114B — Telas de parceiros** — listar e gerenciar Fornecedores, Clientes, Veículos e Transportadoras. **Dep:** T-069, EP-11 (T-112)

---

## EP-07 — Financeiro (Lote 3)
**Fase:** 3 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-condições-de-pagamento), [Domínio](05-modelo-de-dominio.md#5-financeiro)
**Objetivo:** Entidades: **Condição de Pagamento, Forma de Pagamento, Parcelas**; depois **Contas a Pagar/Receber**.

- [ ] **T-070 — Condição de Pagamento: CRUD** — consultas → C/U/D; Delete bloqueado se em parcelas/compras (RN002). **Dep:** EP-03
- [ ] **T-071 — Forma de Pagamento: CRUD** — consultas → C/U/D. **Dep:** EP-03
- [ ] **T-072 — Parcelas: CRUD** — valida FKs condição e forma; Delete bloqueado se em condições/contas. **Dep:** T-070, T-071
- [ ] **T-073 — Contas a Pagar: CRUD + cancelar** — vincula fornecedor/parcela/NFe; `registrarContaPaga`; cancelar. **Dep:** T-072, EP-06 (T-060)
- [ ] **T-074 — Contas a Receber: CRUD + cancelar** — vincula cliente/forma/NFe; `registrarPagamentoRecebido`; cancelar. **Dep:** T-072, EP-06 (T-064)

### Frontend — executar após T-074 completo

- [ ] **T-115A — Telas de financeiro** — listar e gerenciar Condição/Forma de Pagamento, Parcelas, Contas a Pagar e Contas a Receber. **Dep:** T-074, EP-11 (T-112)

---

## EP-08 — Compras (transacional)
**Fase:** 4 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-compras), [Domínio](05-modelo-de-dominio.md#6-compras)
**Objetivo:** registrar compras e itens (`CompraProduto`) atomicamente. Depende de fornecedores, produtos, condição de pagamento, transportadoras.

- [ ] **T-080 — Compras: consultas** — `GET /api/compras[/:id]` com itens, fornecedor, transportadora; testes. **Dep:** EP-05, EP-06, EP-07
- [ ] **T-081 — `realizarCompra` (transacional)** — cria Compra + itens `CompraProduto` em **uma transação** (RNF06); atualiza `saldoProd`/`custoMedioProd`.
  - **Aceite:** falha em qualquer item faz rollback total; saldo atualizado só no sucesso. **Dep:** T-080, T-032
- [ ] **T-082 — Cancelar compra** — `cancelarCompra` com regras de estorno; RN002. **Dep:** T-081
- [ ] **T-083 — `gerarNotaFiscal` (gatilho)** — disponível só **após validação completa** da compra (RN002); compra com NF gerada expõe só consultar/solicitar (RN003).
  - **Aceite:** opção de gerar NF aparece/oculta conforme estado da compra. **Dep:** T-081, EP-09

---

## EP-09 — Nota Fiscal Eletrônica (fiscal)
**Fase:** 4 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-nota-fiscal), [Domínio](05-modelo-de-dominio.md#7-fiscal-nf-e), [Glossário](10-glossario.md)
**Objetivo:** gerenciar NF-e e seus itens (`ProdutoNfe`), vínculo de veículo (`VeiculoNfe`). RNF10.

- [ ] **T-090 — NF-e: consultas** — `GET /api/notas-fiscais[/:id]` com itens e dados de transporte; testes. **Dep:** EP-08
- [ ] **T-091 — NF-e: criar/editar com itens (transacional)** — `adicionarNotaFiscal` + `ProdutoNfe` (ICMS/IPI por item); cálculo de totais. **Dep:** T-090, T-032
- [ ] **T-092 — NF-e: cancelar** — `cancelarNotaFiscal` com RN002. **Dep:** T-091
- [ ] **T-093 — Fluxos por ator** — `solicitarNotaFiscal`, `confirmarEntregaProduto`, `vincularVeiculoNfe` (Fornecedor/Cliente/Transportadora). **Dep:** T-091
- [ ] **T-094 — Emissão (RNF10)** — interface de emissão; integração real com SEFAZ marcada como fora do MVP ([Visão Geral](01-visao-geral.md#fora-de-escopo-por-enquanto)). **Dep:** T-091

### Frontend — executar após T-083 (EP-08) e T-094 completos

- [ ] **T-115B — Telas de compras e NF-e** — registrar, consultar e cancelar compras; consultar e gerenciar notas fiscais. **Dep:** T-083, T-094, EP-11 (T-112)

---

## EP-10 — Acesso e autenticação ⚠️ decisão adiada
**Fase:** 5 · **Docs:** [Segurança](08-seguranca-e-autenticacao.md), [Casos de Uso](07-casos-de-uso.md#gerenciamento-do-usuário-cadastro)
**Objetivo:** `Users`, perfis e login. **Método de autenticação a decidir com o usuário antes de iniciar.**

- [ ] **T-100 — Users: CRUD** — `registrarConta`, `editarConta`, `excluirConta`; perfis. **Dep:** EP-03
- [ ] **T-101 — Login/sessão** — definir mecanismo (JWT vs sessão) — **bloqueado por decisão**; `entrarConta`/`sairConta`. **Dep:** T-100
- [ ] **T-102 — `mudarSenha` + hashing** — senha com hash forte; nunca em texto puro. **Dep:** T-100
- [ ] **T-103 — Ativar auth real (RN001/RNF03)** — substituir stub do T-033; proteger todos os módulos exceto login/registro. **Dep:** T-101
- [ ] **T-104 — Autorização por perfil** — recursos limitados para visitante anônimo; permissões por `perfil`. **Dep:** T-103

### Frontend — executar após T-104 completo

- [ ] **T-116 — Telas de login/conta** — tela de login, cadastro e troca de senha; após decisão de auth. **Dep:** T-104, EP-11 (T-112)

---

## EP-11 — Bootstrap do frontend ✓ concluído
**Fase:** 1 (executado em paralelo com o backend de EP-04) · **Docs:** [Stack](03-stack-tecnologica.md), [Arquitetura](02-arquitetura.md)
**Objetivo:** infraestrutura do SPA pronta antes das primeiras telas (frontend de EP-04).
As telas de cada módulo são construídas dentro do epic de backend correspondente, logo após o backend estar completo e testado.

- [x] **T-110 — Bootstrap do frontend** — Vite + React + TS + **styled-components**; React Router; estrutura `/Frontend/src`. **Dep:** —
- [x] **T-111 — Camada de API e estado** — cliente axios (`services/api.tsx`) com classe `ApiError` (mensagem + `erros` por campo, em PT); **Context API** para estado global. **Dep:** T-110
- [x] **T-112 — Layout responsivo (RNF01)** — shell de navegação (`components/layout`) por menu (um item por módulo); responsivo desktop/mobile. **Dep:** T-110

---

## EP-12 — Qualidade transversal (contínuo)
**Fase:** contínua · **Docs:** [Requisitos](04-requisitos.md), [Segurança](08-seguranca-e-autenticacao.md)
**Objetivo:** garantir RNFs ao longo de todos os épicos.

- [ ] **T-120 — Cobertura de testes (Vitest)** — manter testes por módulo (consultas e C/U/D); meta de cobertura acordada.
- [ ] **T-121 — Segurança de aplicação (RNF05)** — SQLi (postgres.js: *tagged templates* parametrizados + identificadores por whitelist), XSS (sanitização), CSRF (token/SameSite + CORS restrito).
- [ ] **T-122 — Auditoria (RNF04)** — garantir `codUser`/`dt*`/`isActive` em toda escrita; log de inserção/alteração/exclusão.
- [ ] **T-123 — Performance (RNF02)** — consultas < 2s; índices nas FKs mais consultadas.
- [ ] **T-124 — Clean code e docs inline (RNF11)** — lint no CI; manter `docs/` sincronizado com o código.
- [ ] **T-125 — Extensibilidade (RNF12)** — novos módulos seguem o template de EP-03 sem alterar o núcleo.

---

## Resumo de dependências entre épicos

```
EP-00 → EP-01 → EP-02
              ↘ EP-03 → EP-13 → EP-04 → EP-05 ┐
                  (transição)     ↓        ├→ EP-08 → EP-09
                                EP-06 ─────┤
                                  ↓        │
                                EP-07 ─────┘
EP-13 (Prisma → postgres.js) ──→ habilita o padrão de repository de EP-04+
EP-10 (após decisão de auth) ──→ ativa segurança em todos
EP-11 (bootstrap frontend) ────→ habilita telas em EP-04 a EP-10
                                  (cada epic tem seu frontend após backend pronto)
EP-12 (qualidade) atravessa todos os épicos
```

## Documentos relacionados

- [Roadmap](09-roadmap.md) — fases que estes épicos detalham.
- [Modelo de Domínio](05-modelo-de-dominio.md) / [Modelo de Dados](06-modelo-de-dados.md) — o que cada task implementa.
- [Casos de Uso](07-casos-de-uso.md) — regras de negócio (RN) referenciadas nos critérios de aceite.
- [Requisitos](04-requisitos.md) — RF/RNF rastreados pelas tasks.
