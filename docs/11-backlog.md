# 11 — Backlog (Épicos e Tasks)

Passo-a-passo de desenvolvimento do sistema, organizado em **épicos** (`EP-NN`) e
**tasks** (`T-NNN`). Traduz o [Roadmap](09-roadmap.md) e o
[Modelo de Domínio](05-modelo-de-dominio.md) em itens acionáveis.

## Como usar

- Execute os épicos **em ordem** (EP-00 → EP-12). EP-12 é contínuo/transversal.
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

- [ ] **T-001 — Estrutura de diretórios**
  - Criar `/Backend/DB`, `/Backend/src`, `/Frontend/src` conforme [Arquitetura](02-arquitetura.md#estrutura-de-diretórios-raiz-do-projeto).
  - **Aceite:** árvore de pastas existe; `.gitignore` cobre `node_modules`, `.env`, build.
  - **Dependências:** —

- [ ] **T-002 — Inicializar backend (Node + TypeScript)**
  - `npm init`, instalar TypeScript, `tsconfig.json` estrito, `ts-node`/`tsx` para dev.
  - **Aceite:** `npx tsc --noEmit` roda sem erro num arquivo de exemplo; script `dev` definido.
  - **Dependências:** T-001

- [ ] **T-003 — Express + estrutura de app**
  - Instalar Express; criar `src/app.ts` (instância) e `src/server.ts` (bootstrap); rota `GET /health`.
  - **Aceite:** `npm run dev` sobe o servidor; `GET /health` retorna `200`.
  - **Dependências:** T-002

- [ ] **T-004 — Lint, format e convenções**
  - ESLint + Prettier (clean code — RNF11); padronizar idioma de identificadores (decisão do [CLAUDE.md](../CLAUDE.md)).
  - **Aceite:** `npm run lint` passa; regras documentadas no README do backend.
  - **Dependências:** T-002

- [ ] **T-005 — Configurar Vitest**
  - Instalar e configurar Vitest no backend; teste smoke (`GET /health`).
  - **Aceite:** `npm test` executa e o teste de health passa.
  - **Dependências:** T-003

- [ ] **T-006 — Atualizar a seção "Comandos" do [CLAUDE.md](../CLAUDE.md)**
  - Substituir o placeholder pelos scripts reais (dev, test, lint, migrate, seed).
  - **Aceite:** comandos do CLAUDE.md correspondem ao `package.json`.
  - **Dependências:** T-002, T-005

---

## EP-01 — Modelagem do banco (3FN)
**Fase:** 0 · **Docs:** [Modelo de Dados](06-modelo-de-dados.md), [Modelo de Domínio](05-modelo-de-dominio.md)
**Objetivo:** schema Prisma normalizado, fonte de verdade do banco.

- [ ] **T-010 — Configurar Prisma + Local Prisma Postgres**
  - Instalar Prisma; `schema.prisma` em `/Backend/DB`; `DATABASE_URL` em `.env`.
  - **Aceite:** `npx prisma validate` ok; conexão com o Postgres local funciona.
  - **Dependências:** T-002

- [ ] **T-011 — Modelar entidades-base e auditoria**
  - Modelar `Users` e o padrão de auditoria (`codUser`, `dtCriacao`, `dtEdicao`, `isActive`) reutilizável.
  - Corrigir grafias do diagrama (`tenha`→`senha` etc.) conforme [CLAUDE.md](../CLAUDE.md#convenções-de-nomenclatura).
  - **Aceite:** modelos compilam; `codUser` é FK opcional para `Users` (auth adiada — EP-10).
  - **Dependências:** T-010

- [ ] **T-012 — Modelar subdomínios geográfico, parceiros e catálogo**
  - `Paises`, `Estados`, `Cidades`, `Fornecedores`, `Clientes`, `Transportadoras`, `Veiculos`, `Produtos`, `Categorias`, `NCM_SH`.
  - Associativas N:N **puras** (sem colunas redundantes): `ProdutoFornecedor`, `ProdutoCategoria` — ver [pendências de normalização](06-modelo-de-dados.md#princípios-de-modelagem).
  - **Aceite:** relações conferem com [Modelo de Dados](06-modelo-de-dados.md#tabelas-e-chaves); 3FN respeitada.
  - **Dependências:** T-011

- [ ] **T-013 — Modelar financeiro, compras e fiscal**
  - `CondicaoDePagamento`, `FormaDePagamento`, `Parcelas`, `ContasAPagar`, `ContasAReceber`, `Compras`, `CompraProduto`, `NotasFiscaisEletronicas`, `ProdutoNfe`, `VeiculoNfe`.
  - **Aceite:** FKs e associativas conforme docs; campos fiscais presentes ([Glossário](10-glossario.md)).
  - **Dependências:** T-012

- [ ] **T-014 — Política de exclusão e migration inicial**
  - Definir `onDelete: Restrict` nas FKs e/ou soft delete (`isActive`) — RN002.
  - `npx prisma migrate dev --name init`.
  - **Aceite:** migration aplicada; tabelas criadas no banco; cliente Prisma gerado.
  - **Dependências:** T-013

---

## EP-02 — Scripts de seed
**Fase:** 0 · **Docs:** [Modelo de Dados](06-modelo-de-dados.md#scripts-de-seed), [Roadmap](09-roadmap.md)
**Objetivo:** popular o banco respeitando dependências.

- [ ] **T-020 — Infra de seed**
  - `prisma/seed.ts` + `prisma.seed` no `package.json`; idempotente (`upsert`).
  - **Aceite:** `npx prisma db seed` roda sem erro e pode rodar 2× sem duplicar.
  - **Dependências:** T-014

- [ ] **T-021 — Seed geográfico**
  - Brasil → Estados (UFs) → algumas Cidades (na ordem de dependência).
  - **Aceite:** consultas retornam países/estados/cidades coerentes.
  - **Dependências:** T-020

- [ ] **T-022 — Seed de catálogo e parceiros (amostra)**
  - Categorias, NCM/SH, alguns Produtos; 1–2 Fornecedores, Clientes, Transportadoras, Veículos.
  - **Aceite:** dados de amostra suficientes para testar os CRUDs das Fases 1–2.
  - **Dependências:** T-021

---

## EP-03 — Arquitetura base do backend
**Fase:** 0/1 · **Docs:** [Arquitetura](02-arquitetura.md), [Segurança](08-seguranca-e-autenticacao.md)
**Objetivo:** esqueleto em camadas reutilizável por todos os módulos.

- [ ] **T-030 — Camadas e organização por módulo**
  - Estrutura `routes → controllers → services → repositories`; um módulo por subdomínio.
  - **Aceite:** módulo de exemplo segue o padrão; Prisma isolado na camada de repositório.
  - **Dependências:** T-003, T-010

- [ ] **T-031 — Tratamento de erros e respostas padrão**
  - Middleware de erro central; formato JSON de erro/sucesso; **mensagens em português** (RNF07).
  - **Aceite:** erros retornam status + mensagem PT consistentes; 404 e 400 tratados.
  - **Dependências:** T-030

- [ ] **T-032 — Wrapper de transação (atomicidade)**
  - Helper sobre `prisma.$transaction` para operações críticas (RNF06).
  - **Aceite:** falha no meio de uma operação multi-tabela faz rollback total (teste).
  - **Dependências:** T-030

- [ ] **T-033 — Middleware de autenticação (stub)**
  - Stub que injeta `codUser` (auth real em EP-10); ponto único para ativar RN001/RNF03.
  - **Aceite:** rotas passam por ele; troca para auth real será localizada.
  - **Dependências:** T-030

- [ ] **T-034 — Validação de entrada**
  - Adotar validador (ex.: Zod) e padrão de validação por rota (proteção de entrada — RNF05).
  - **Aceite:** payload inválido retorna 400 com mensagem PT clara.
  - **Dependências:** T-031

---

## EP-04 — Cadastros geográficos (Lote 1)
**Fase:** 1 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-países), [Domínio](05-modelo-de-dominio.md#1-localização-geografia)
**Objetivo:** primeiros CRUDs, pré-requisito de todos os demais. Entidades: **Países, Estados, Cidades**.

> Aplicar o [Padrão de CRUD](#padrão-de-crud-referência-para-ep-04-a-ep-09) a cada entidade.

- [ ] **T-040 — Países: consultas (Read)** — listar + obter por id; `GET /api/paises[/:id]`; testes.
  - **Aceite:** lista e item retornam 200; tempo de resposta < 2s (RNF02). **Dep:** EP-03, T-021
- [ ] **T-041 — Países: Create/Update** — `POST`/`PUT` com validação. **Aceite:** cria/edita país válido; 400 em payload inválido. **Dep:** T-040
- [ ] **T-042 — Países: Delete (RN002)** — soft delete; **bloquear** se houver Estados vinculados. **Aceite:** excluir país com estado retorna erro PT; sem dependentes inativa. **Dep:** T-041
- [ ] **T-043 — Estados: consultas** — `GET /api/estados[/:id]`, filtro por país; testes. **Dep:** T-040
- [ ] **T-044 — Estados: Create/Update** — valida FK país. **Dep:** T-043
- [ ] **T-045 — Estados: Delete (RN002)** — bloquear se houver Cidades/Fornecedores vinculados. **Dep:** T-044
- [ ] **T-046 — Cidades: consultas** — `GET /api/cidades[/:id]`, filtro por estado; testes. **Dep:** T-043
- [ ] **T-047 — Cidades: Create/Update** — valida FK estado. **Dep:** T-046
- [ ] **T-048 — Cidades: Delete (RN002)** — bloquear se houver Clientes/Fornecedores/Transportadoras vinculados. **Dep:** T-047

---

## EP-05 — Catálogo de produtos (Lote 2A)
**Fase:** 2 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-produtos), [Domínio](05-modelo-de-dominio.md#3-produtos-e-catálogo)
**Objetivo:** Entidades: **Categorias, NCM/SH, Produtos** (RN003: vincular NCM/SH e categorias).

- [ ] **T-050 — Categorias: consultas** — `GET /api/categorias[/:id]`; testes. **Dep:** EP-03, T-022
- [ ] **T-051 — Categorias: Create/Update.** **Dep:** T-050
- [ ] **T-052 — Categorias: Delete (RN002)** — bloquear se vinculada a produtos. **Dep:** T-051
- [ ] **T-053 — NCM/SH: consultas** — `GET /api/ncm-sh[/:id]`; testes. **Dep:** EP-03, T-022
- [ ] **T-054 — NCM/SH: Create/Update.** **Dep:** T-053
- [ ] **T-055 — NCM/SH: Delete (RN002)** — bloquear se vinculado a produtos. **Dep:** T-054
- [ ] **T-056 — Produtos: consultas** — `GET /api/produtos[/:id]`; incluir categoria/NCM; filtros; testes.
  - **Aceite:** retorna produto com categoria e NCM resolvidos. **Dep:** T-050, T-053
- [ ] **T-057 — Produtos: Create/Update (RN003)** — vincular `codCategoria` e `codNcmSH`; vínculo Produto↔Fornecedor (`ProdutoFornecedor`).
  - **Aceite:** cria produto com categoria/NCM; vincula fornecedor. **Dep:** T-056
- [ ] **T-058 — Produtos: Delete (RN002)** — bloquear se em compras/fornecedores/notas. **Dep:** T-057

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

---

## EP-07 — Financeiro (Lote 3)
**Fase:** 3 · **Docs:** [Casos de Uso](07-casos-de-uso.md#gerenciar-condições-de-pagamento), [Domínio](05-modelo-de-dominio.md#5-financeiro)
**Objetivo:** Entidades: **Condição de Pagamento, Forma de Pagamento, Parcelas**; depois **Contas a Pagar/Receber**.

- [ ] **T-070 — Condição de Pagamento: CRUD** — consultas → C/U/D; Delete bloqueado se em parcelas/compras (RN002). **Dep:** EP-03
- [ ] **T-071 — Forma de Pagamento: CRUD** — consultas → C/U/D. **Dep:** EP-03
- [ ] **T-072 — Parcelas: CRUD** — valida FKs condição e forma; Delete bloqueado se em condições/contas. **Dep:** T-070, T-071
- [ ] **T-073 — Contas a Pagar: CRUD + cancelar** — vincula fornecedor/parcela/NFe; `registrarContaPaga`; cancelar. **Dep:** T-072, EP-06 (T-060)
- [ ] **T-074 — Contas a Receber: CRUD + cancelar** — vincula cliente/forma/NFe; `registrarPagamentoRecebido`; cancelar. **Dep:** T-072, EP-06 (T-064)

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

---

## EP-10 — Acesso e autenticação ⚠️ decisão adiada
**Fase:** 5 · **Docs:** [Segurança](08-seguranca-e-autenticacao.md), [Casos de Uso](07-casos-de-uso.md#gerenciamento-do-usuário-cadastro)
**Objetivo:** `Users`, perfis e login. **Método de autenticação a decidir com o usuário antes de iniciar.**

- [ ] **T-100 — Users: CRUD** — `registrarConta`, `editarConta`, `excluirConta`; perfis. **Dep:** EP-03
- [ ] **T-101 — Login/sessão** — definir mecanismo (JWT vs sessão) — **bloqueado por decisão**; `entrarConta`/`sairConta`. **Dep:** T-100
- [ ] **T-102 — `mudarSenha` + hashing** — senha com hash forte; nunca em texto puro. **Dep:** T-100
- [ ] **T-103 — Ativar auth real (RN001/RNF03)** — substituir stub do T-033; proteger todos os módulos exceto login/registro. **Dep:** T-101
- [ ] **T-104 — Autorização por perfil** — recursos limitados para visitante anônimo; permissões por `perfil`. **Dep:** T-103

---

## EP-11 — Frontend SPA
**Fase:** 6 · **Docs:** [Stack](03-stack-tecnologica.md), [Arquitetura](02-arquitetura.md)
**Objetivo:** SPA React consumindo a API, na mesma ordem de módulos do backend.

- [ ] **T-110 — Bootstrap do frontend** — Vite + React + TS + TailwindCSS; React Router; estrutura `/Frontend/src`. **Dep:** —
- [ ] **T-111 — Camada de API e estado** — cliente HTTP; **Context API** para estado global; tratamento de erro PT. **Dep:** T-110
- [ ] **T-112 — Layout responsivo (RNF01)** — shell de navegação por menu (um item por módulo); responsivo desktop/mobile. **Dep:** T-110
- [ ] **T-113 — Telas de cadastros básicos** — Países/Estados/Cidades (listar primeiro, depois formulários). **Dep:** T-111, EP-04
- [ ] **T-114 — Telas de catálogo e parceiros** — Produtos/Categorias/NCM, Fornecedores/Clientes/Transportadoras. **Dep:** EP-05, EP-06
- [ ] **T-115 — Telas de financeiro, compras e NF** — conforme módulos concluídos no backend. **Dep:** EP-07, EP-08, EP-09
- [ ] **T-116 — Telas de login/conta** — após decisão de auth (EP-10). **Dep:** EP-10

---

## EP-12 — Qualidade transversal (contínuo)
**Fase:** contínua · **Docs:** [Requisitos](04-requisitos.md), [Segurança](08-seguranca-e-autenticacao.md)
**Objetivo:** garantir RNFs ao longo de todos os épicos.

- [ ] **T-120 — Cobertura de testes (Vitest)** — manter testes por módulo (consultas e C/U/D); meta de cobertura acordada.
- [ ] **T-121 — Segurança de aplicação (RNF05)** — SQLi (Prisma parametrizado), XSS (sanitização), CSRF (token/SameSite + CORS restrito).
- [ ] **T-122 — Auditoria (RNF04)** — garantir `codUser`/`dt*`/`isActive` em toda escrita; log de inserção/alteração/exclusão.
- [ ] **T-123 — Performance (RNF02)** — consultas < 2s; índices nas FKs mais consultadas.
- [ ] **T-124 — Clean code e docs inline (RNF11)** — lint no CI; manter `docs/` sincronizado com o código.
- [ ] **T-125 — Extensibilidade (RNF12)** — novos módulos seguem o template de EP-03 sem alterar o núcleo.

---

## Resumo de dependências entre épicos

```
EP-00 → EP-01 → EP-02
              ↘ EP-03 → EP-04 → EP-05 ┐
                          ↓        ├→ EP-08 → EP-09
                        EP-06 ─────┤
                          ↓        │
                        EP-07 ─────┘
EP-10 (após decisão de auth) ──→ ativa segurança em todos
EP-11 (frontend) consome cada módulo após pronto no backend
EP-12 (qualidade) atravessa todos os épicos
```

## Documentos relacionados

- [Roadmap](09-roadmap.md) — fases que estes épicos detalham.
- [Modelo de Domínio](05-modelo-de-dominio.md) / [Modelo de Dados](06-modelo-de-dados.md) — o que cada task implementa.
- [Casos de Uso](07-casos-de-uso.md) — regras de negócio (RN) referenciadas nos critérios de aceite.
- [Requisitos](04-requisitos.md) — RF/RNF rastreados pelas tasks.
