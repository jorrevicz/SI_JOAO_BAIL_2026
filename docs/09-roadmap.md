# 09 — Roadmap de Implementação

Ordem prática de construção, derivada das **prioridades de projeto**. Os módulos
referem-se ao [Modelo de Domínio](05-modelo-de-dominio.md) e os requisitos ao
[documento de Requisitos](04-requisitos.md).

## Princípios de entrega

1. **Backend-first por módulo** — concluir e testar o backend de cada módulo antes
   de construir o frontend correspondente; o frontend avança em paralelo, módulo a
   módulo, não ao final de todo o backend.
2. **CRUDs em lotes de três** ("revezamento três em três") — começando pelos mais
   básicos, para agilizar e evitar complexidade.
3. **Consultas (Read) primeiro**, depois as demais operações (Create/Update/Delete)
   de cada módulo.
4. **Criar o banco**, depois **scripts de seed**, depois **integrar** o backend às
   consultas.
5. **Login, compra e venda** completos: decisão e detalhamento **adiados**.
6. **TDD obrigatório para services:** ao criar ou modificar qualquer *service* de
   backend, aplicar o ciclo Red → Green → Refactor antes de avançar para o próximo
   método. Detalhes em [CLAUDE.md](../CLAUDE.md#princípios-obrigatórios).

## Fase 0 — Fundação ✓ concluída (EP-00 a EP-03)

- [x] Estrutura de diretórios (`/Backend/src/db`, `/Backend/src`, `/Frontend/src`) —
      ver [Arquitetura](02-arquitetura.md#estrutura-de-diretórios-raiz-do-projeto).
- [x] Configurar acesso ao **PostgreSQL local** ([Stack](03-stack-tecnologica.md)).
- [x] Modelar o schema do banco em formas normais
      ([Modelo de Dados](06-modelo-de-dados.md)).
- [x] Scripts de **seed** para os cadastros básicos.
- [x] Padronizar nomes (corrigir grafias do diagrama — ver
      [nota de grafia](05-modelo-de-dominio.md#convenções-de-atributos-comuns)).
- [x] Arquitetura base do backend: camadas, erros, transação, auth stub, validação Zod.

> **EP-13 concluído:** a camada de dados migrou de Prisma para **postgres.js +
> node-pg-migrate + kanel** (sem ORM). Detalhes em
> [EP-13 do Backlog](11-backlog.md#ep-13--transição-da-camada-de-dados-prisma--postgresjs).

## Fase 1 — Cadastros básicos (lote de 3) ✓ concluída

Pré-requisito de todo o resto (geografia). Implementadas **consultas primeiro**, depois C/U/D.

1. [x] **Países** (RF01) — backend + telas.
2. [x] **Estados** (RF02) — backend + telas.
3. [x] **Cidades** (RF03) — backend + telas.

> **Backend (EP-04) concluído:** CRUDs em 4 camadas
> (`schema → controller → service → repository → routes`) com testes de service, repository
> (rollback) e rota (`supertest`). Inclui a migration de índices únicos `Paises(ddi)` e
> `Estados(codPais, uf)` — ver [EP-04 do Backlog](11-backlog.md#ep-04--cadastros-geográficos-lote-1).
> **Frontend concluído:** bootstrap do SPA (EP-11 — Vite + React + TS + styled-components +
> React Router + camada axios) e telas de Países, Estados e Cidades (TanStack Table, navegação
> hierárquica por query params, formulários em modal).
>
> **Validação de formulários (backend-driven):** o Backend é a única fonte de verdade de
> validação; a resposta 400 devolve `erros: { campo: mensagem }` e o Frontend mapeia por campo,
> sem duplicar schema nem adicionar Zod — ver
> [decisão de validação](ref/validacao-frontend-backend-driven.md).
>
> **▶ Próximo passo:** Fase 2 — Catálogo e parceiros (EP-05: Categorias, Produtos).

## Fase 2 — Catálogo e parceiros (lotes de 3)

- Lote 2A: **Categorias**, **Produtos** (RF09) — inclui vínculos categoria.
- Lote 2B: **Fornecedores** (RF07), **Clientes** (RF08), **Transportadoras** (RF10).
- **Veículos** (RF04) entra junto das transportadoras (dependência logística).

> **Frontend desta fase** (após cada lote de backend pronto): telas de Categorias/Produtos,
> depois telas de Fornecedores/Clientes/Transportadoras/Veículos.

## Fase 3 — Financeiro (lote de 3)

- **Condições de Pagamento** (RF05), **Parcelas** (RF06), **Formas de Pagamento**.
- Em seguida: **Contas a Pagar** (RF11) e **Contas a Receber** (RF12).

> **Frontend desta fase** (após backend pronto): telas de Condição/Forma de Pagamento,
> Parcelas, Contas a Pagar e Contas a Receber.

## Fase 4 — Transacional

- **Compras** (RF13) — operação atômica
  ([RNF06](04-requisitos.md#requisitos-não-funcionais)).
- **Nota Fiscal Eletrônica** (RF14, RNF10) — depende de compras e do módulo fiscal.

> **Frontend desta fase** (após backend pronto): telas de Compras e NF-e.

## Fase 5 — Acesso e fluxos adiados

- **Gerenciamento de Usuários** e **Login** (RF15) —
  ver [Segurança](08-seguranca-e-autenticacao.md).
- Fluxos completos de **compra** e **venda** (a decidir).

> **Frontend desta fase** (após backend pronto): telas de login e conta de usuário.

## Dependências entre módulos

```
Países → Estados → Cidades → { Fornecedores, Clientes, Transportadoras, Veículos }
Categorias → Produtos
Cond. Pagamento → Parcelas → { Contas a Pagar, Contas a Receber }
Fornecedores + Produtos + Cond. Pagamento + Transportadoras → Compras → NF-e
```

> Sempre cadastrar o "pai" antes do "filho" — daí Países/Estados/Cidades virem primeiro.

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RFs entregues em cada fase.
- [Modelo de Domínio](05-modelo-de-dominio.md) — entidades de cada módulo.
- [Modelo de Dados](06-modelo-de-dados.md) — schema e seeds da Fase 0.
