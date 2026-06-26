# 02 — Arquitetura

## Estilo arquitetural

O sistema é uma **Web API REST** com frontend SPA desacoplado, seguindo a stack
**PERN**:

- **P**ostgreSQL — banco de dados relacional.
- **E**xpress — framework HTTP do backend.
- **R**eact — biblioteca de interface (SPA).
- **N**ode.js — runtime do backend.

Linguagem única em todo o projeto: **TypeScript**.
Ferramentas e versões em [Stack Tecnológica](03-stack-tecnologica.md).

```
+------------------+
|   Frontend SPA   |
|  (React + Vite)  |
+------------------+
         |
         |  HTTP/JSON (REST)
         |
+------------------+
|   Backend API    |
|  (Express/Node)  |
+------------------+
         |
         |  postgres.js (driver SQL)
         |
+------------------+
|    PostgreSQL    |
+------------------+
```

## Estrutura de diretórios (raiz do projeto)

```
/Backend
  /DB                  → migrations SQL, seed
    /migrations        → migrations SQL versionadas (node-pg-migrate)
    seed.ts            → dados iniciais (idempotente, INSERT ... ON CONFLICT)
  /src                 → código-fonte da API
    /lib               → instância compartilhada do cliente postgres.js (`sql`)
    /db                → arquivos relacionados ao postgresql
      /migrations      → migrations feitas com postgre.js
      /types           → tipos das tabelas gerados pelo kanel (introspecção)
    /modules           → um subdiretório por subdomínio de negócio
      /health          → health check (health.routes.ts + health.controller.ts)
      /paises          → CRUD de Países (schema, controller, service, repository, routes)
      /estados         → CRUD de Estados (mesmo padrão de 5 arquivos)
      /cidades         → CRUD de Cidades (mesmo padrão de 5 arquivos)
      ...
    /shared            → utilitários transversais a todos os módulos
      /errors          → AppError (exceção de domínio com status HTTP)
      /middleware      → authMiddleware (stub) e errorHandler (central)
      /transaction     → withTransaction (wrapper de sql.begin)
      /validation      → validate (middleware Zod; 400 com erros por campo)
    /types             → augmentações de tipos Express (codUser em Request)
    /__tests__         → testes Vitest (infraestrutura + integração de repositórios)
    app.ts             → instância Express (rotas e middlewares)
    server.ts          → bootstrap (escuta na porta; encerra `sql` no shutdown)
  kanel.config.cjs          → configuração do kanel (geração de tipos)
  database.config.json      → configuração do node-pg-migrate (migrations)
  package.json         → scripts de migrate/seed/types:gen; node-pg-migrate lê DATABASE_URL do .env
/Frontend
  /src                 → código-fonte da SPA React
    /assets            → arquivos estáticos (imagens, fontes, ícones)
    /components        → componentes reutilizáveis (cada um com index.tsx e/ou style.ts)
      /layout          → shell de navegação responsivo (sidebar + conteúdo)
      /pagina          → blocos de página (Toolbar, busca, Alerta, Breadcrumb, tooltip)
      /tabela          → estilos da tabela de dados (TanStack Table) e paginação
      /modal           → modal de formulário (ModalCard, Campo, ErroCampo, ações)
      /botao           → botão base (variantes primário/secundário/perigo)
      /botaoConsultar  → botão que navega para o filho passando contexto por query params
    /hooks             → hooks React customizados compartilhados entre páginas
      tabela.ts        → useTabelaOrdenada (estado de ordenação do TanStack Table)
    /pages             → páginas por rota (cada uma com index.tsx + *Form.tsx + style.ts)
      /home            → placeholder inicial
      /paises          → lista + PaisForm (CRUD em modal)
      /estados         → lista + EstadoForm (filtra por país via query param)
      /cidades         → lista + CidadeForm (filtra por estado via query param)
    /services          → clientes HTTP (axios); um arquivo por domínio de API
      api.tsx          → instância axios + classe ApiError (mensagem + erros por campo)
      paises.ts        → serviço de Países (estados.ts e cidades.ts no mesmo padrão)
    /styles            → estilos globais
      globalStyles.ts  → createGlobalStyle (reset e variáveis CSS globais)
    /themes            → tokens de design (cores, tipografia, espaçamentos)
    /utils             → funções utilitárias puras (queryParams, formatters, etc.)
    main.tsx           → ponto de entrada React (monta a árvore e injeta globalStyles)
/docs                  → esta base de conhecimento
```

## Camadas sugeridas do backend (`/Backend/src`)

A separação abaixo materializa a POO e mantém as regras de negócio fora do
transporte HTTP. Não é imposta pela documentação original, mas é a convenção
recomendada para esta base:

| Camada | Responsabilidade |
|--------|------------------|
| **Routes** | Mapeia URLs REST para controllers. |
| **Controllers** | Traduz HTTP ⇄ domínio; validação de entrada; orquestra services. |
| **Services / Domain** | Regras de negócio (classes do domínio e suas operações). |
| **Repositories / Data** | Acesso a dados via postgres.js (SQL escrito à mão, parametrizado); isola o banco do domínio. |
| **Migrations SQL** | Definição do banco em SQL versionado por node-pg-migrate (em `/Backend/src/db/migrations`). |

Cada subdomínio de [Modelo de Domínio](05-modelo-de-dominio.md) tende a virar um
módulo nessa estrutura (ex.: localização, parceiros, produtos, financeiro, compras,
fiscal, acesso).

## Acesso a dados (postgres.js)

A camada de repositórios usa o cliente **postgres.js** (`sql`) com SQL escrito à mão.
Convenções obrigatórias de cada repository (detalhes em
[Segurança](08-seguranca-e-autenticacao.md) e [Stack](03-stack-tecnologica.md)):

- **Valores sempre por interpolação de template** (`sql\`... WHERE x = ${valor}\``) — o
  postgres.js os envia como parâmetros, nunca como texto concatenado (defesa SQLi, RNF05).
- **Identificadores dinâmicos** (coluna de ordenação, nome de tabela) apenas via
  `sql(coluna)` a partir de uma **whitelist** — nunca interpolar string crua.
- **Soft delete:** consultas filtram `isActive = true`; "remover" é `UPDATE ... SET isActive = false`.
- **Auditoria:** toda escrita preenche `codUser`, `dtCriacao`/`dtEdicao`.
- **Paginação por cursor** sobre o `codX` (sem `OFFSET`) — ver
  [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem).
- **Atomicidade:** operações multi-tabela usam `withTransaction` (wrapper de `sql.begin`).
- **Tipos das linhas** vêm dos arquivos gerados pelo **kanel** em `src/db`; DTOs de entrada
  são validados e tipados por **Zod**.
- Erros do Postgres (ex.: `23505` unique, `23503` FK / RN002) são mapeados para `AppError`
  com mensagem em português no `errorHandler`.

## Padrão de API REST

Convenção recomendada (pluralize o recurso, use o nome de domínio em português ou seu
equivalente em inglês de forma consistente no código):

```
GET    /api/paises          → consultar (lista)
GET    /api/paises/:id      → consultar (um)
POST   /api/paises          → adicionar
PUT    /api/paises/:id      → editar
DELETE /api/paises/:id      → remover
```

A coluna **consultas primeiro** do [Roadmap](09-roadmap.md) significa implementar os
`GET` de cada recurso antes dos demais verbos.

## Validação de entrada e erros por campo (RNF05, RNF07)

A validação de payload é feita **no Backend**, pelo middleware `validate(schema)`
(`src/shared/validation/validate.ts`) com os schemas Zod de cada módulo (`*.schema.ts`).
Quando o `safeParse` falha, a resposta **400** carrega tanto a `mensagem` agregada quanto um
**mapa de erros por campo**, derivado de `issue.path` do Zod:

```jsonc
// 400 — falha de validação
{ "mensagem": "...", "erros": { "pais": "...", "sigla": "..." } }
```

Os demais erros (conflito/dependentes via `errorHandler` — `23505` → 409, `23503` → 409, ou
500) respondem **apenas com `mensagem`**, sem o mapa `erros`.

Esse contrato é o que sustenta a **validação backend-driven** do Frontend: como os nomes dos
campos no schema Zod, no payload e no estado dos formulários coincidem, o Frontend mapeia
`erros[campo]` direto para cada input — **sem duplicar schema nem adicionar Zod no Frontend**.
A camada axios expõe a classe `ApiError` (que carrega `erros`), e cada formulário renderiza a
mensagem sob o campo correspondente. Detalhes e alternativas descartadas em
[Validação de formulários (backend-driven)](ref/validacao-frontend-backend-driven.md).

## Estratégia de testes (TDD)

Todo *service* de backend é desenvolvido com **Test-Driven Development**:
ciclo **Red → Green → Refactor** antes de avançar para o próximo método.

| Tipo | Alvo | Ferramenta | Isolamento |
|------|------|-----------|------------|
| **Unitário** | Services / Domain | Vitest | Repositório mockado (`vi.fn()`) |
| **Integração** | Routes / Controllers | Vitest + `supertest` | Banco de teste descartável |
| **Integração** | Repositories / Data | Vitest | Banco de teste, cada teste em transação revertida (rollback) |

Regras:
- Escreva o teste **antes** do código de produção; ele deve falhar na primeira execução.
- Testes de *service* **não** acessam banco — mockam o repositório.
- Testes de rota cobrem os verbos implementados (GET, POST, PUT, DELETE) e os casos
  de erro (400 validação, 404 não encontrado, 409 conflito/dependentes).
- Nenhum *service* novo ou modificado é considerado concluído sem cobertura de testes.

## Documentos relacionados

- [Stack Tecnológica](03-stack-tecnologica.md) — ferramentas concretas de cada camada.
- [Modelo de Domínio](05-modelo-de-dominio.md) — as classes que vivem na camada de domínio.
- [Modelo de Dados](06-modelo-de-dados.md) — o esquema que as migrations SQL materializam.
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — middleware de auth e auditoria.
- [Princípios de Engenharia](12-principios-de-engenharia.md#1-programação-orientada-a-objetos-poo) - lista de princípios adotados para o projeto.
