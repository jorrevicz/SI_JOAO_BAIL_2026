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
      ...
    /shared            → utilitários transversais a todos os módulos
      /errors          → AppError (exceção de domínio com status HTTP)
      /middleware      → authMiddleware (stub) e errorHandler (central)
      /transaction     → withTransaction (wrapper de sql.begin)
      /validation      → validate (factory de middleware Zod)
    /types             → augmentações de tipos Express (codUser em Request)
    /__tests__         → testes Vitest (infraestrutura + integração de repositórios)
    app.ts             → instância Express (rotas e middlewares)
    server.ts          → bootstrap (escuta na porta; encerra `sql` no shutdown)
  kanel.config.cjs          → configuração do kanel (geração de tipos)
  database.config.json      → configuração do node-pg-migrate (migrations
/Frontend
  /src                 → código-fonte da SPA React
    /assets            → arquivos estáticos (imagens, fontes, ícones)
    /components        → componentes reutilizáveis (cada um com index.tsx + style.js)
    /hooks             → hooks React customizados compartilhados entre páginas
    /pages             → páginas por rota (cada uma com index.tsx + style.js)
    /services          → clientes HTTP (axios); um arquivo por domínio de API
      api.tsx          → instância axios configurada com a URL base
    /styles            → estilos globais
    /themes            → tokens de design (cores, tipografia, espaçamentos)
    /utils             → funções utilitárias puras (formatação, validação, etc.)
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
  de erro (404, 422, 409).
- Nenhum *service* novo ou modificado é considerado concluído sem cobertura de testes.

## Documentos relacionados

- [Stack Tecnológica](03-stack-tecnologica.md) — ferramentas concretas de cada camada.
- [Modelo de Domínio](05-modelo-de-dominio.md) — as classes que vivem na camada de domínio.
- [Modelo de Dados](06-modelo-de-dados.md) — o esquema que as migrations SQL materializam.
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — middleware de auth e auditoria.
- [Princípios de Engenharia](12-principios-de-engenharia.md#1-programação-orientada-a-objetos-poo) - lista de princípios adotados para o projeto.
