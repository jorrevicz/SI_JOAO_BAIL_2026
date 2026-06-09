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
┌─────────────────┐      HTTP/JSON (REST)      ┌─────────────────┐      Prisma ORM      ┌──────────────┐
│  Frontend SPA   │  ───────────────────────▶  │  Backend API    │  ─────────────────▶  │  PostgreSQL  │
│  (React + Vite) │  ◀───────────────────────  │  (Express/Node) │  ◀─────────────────  │              │
└─────────────────┘                            └─────────────────┘                      └──────────────┘
```

## Estrutura de diretórios (raiz do projeto)

```
/Backend
  /DB          → modelagem do banco, migrations, scripts de seed (alimentação inicial)
  /src         → código-fonte da API (camadas descritas abaixo)
/Frontend
  /src         → código-fonte da SPA React
/docs          → esta base de conhecimento
```

## Princípios

- **Programação Orientada a Objetos (POO):** o domínio é modelado em classes (ver
  [Modelo de Domínio](05-modelo-de-dominio.md)), com responsabilidades encapsuladas.
  As operações listadas como métodos no diagrama de classes são o contrato de
  comportamento de cada entidade.
- **Banco em formas normais:** o esquema relacional segue as formas normais (até a
  3FN), com tabelas associativas para relações N:N — detalhado em
  [Modelo de Dados](06-modelo-de-dados.md).
- **REST:** recursos expostos por URLs previsíveis, verbos HTTP semânticos
  (GET/POST/PUT/DELETE) e respostas JSON.
- **Atomicidade transacional:** operações críticas (compras, notas fiscais, contas)
  rodam em transação com rollback em caso de falha — ver
  [Requisitos não funcionais](04-requisitos.md#requisitos-não-funcionais).
- **Backend primeiro:** o backend e o banco são construídos e validados antes do
  frontend — ver [Roadmap](09-roadmap.md).

## Camadas sugeridas do backend (`/Backend/src`)

A separação abaixo materializa a POO e mantém as regras de negócio fora do
transporte HTTP. Não é imposta pela documentação original, mas é a convenção
recomendada para esta base:

| Camada | Responsabilidade |
|--------|------------------|
| **Routes** | Mapeia URLs REST para controllers. |
| **Controllers** | Traduz HTTP ⇄ domínio; validação de entrada; orquestra services. |
| **Services / Domain** | Regras de negócio (classes do domínio e suas operações). |
| **Repositories / Data** | Acesso a dados via Prisma; isola o ORM do domínio. |
| **Prisma schema** | Definição declarativa do banco (em `/Backend/DB`). |

Cada subdomínio de [Modelo de Domínio](05-modelo-de-dominio.md) tende a virar um
módulo nessa estrutura (ex.: localização, parceiros, produtos, financeiro, compras,
fiscal, acesso).

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

## Documentos relacionados

- [Stack Tecnológica](03-stack-tecnologica.md) — ferramentas concretas de cada camada.
- [Modelo de Domínio](05-modelo-de-dominio.md) — as classes que vivem na camada de domínio.
- [Modelo de Dados](06-modelo-de-dados.md) — o esquema que o Prisma materializa.
- [Segurança e Autenticação](08-seguranca-e-autenticacao.md) — middleware de auth e auditoria.
