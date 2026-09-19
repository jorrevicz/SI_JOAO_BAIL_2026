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

- [x] Lote 2A: **Categorias**, **Produtos** (RF09) — CRUDs backend + telas frontend.
- [x] Lote 2B: **Fornecedores** (RF07), **Clientes** (RF08), **Transportadoras** (RF10), **Veículos** (RF04).

> **Lote 2A concluído:** backend em 4 camadas com testes TDD (service unitário, repository
> em rollback, routes supertest) e frontend com navegação hierárquica Categorias → Produtos
> por query params, formulário em modal com seleção de categoria.
>
> **Lote 2B concluído:** backend (Veículos, Fornecedores, Clientes, Transportadoras) em 4
> camadas com testes TDD; soft delete e HasDependents para cada entidade; frontend com
> telas de listagem e formulário modal, selects de Cidades/Estados/Veículos carregados via
> API; menu lateral atualizado.
>
> **▶ Próximo passo:** Fase 3 — Condições de Pagamento, Formas de Pagamento, Parcelas.

## Fase 3 — Financeiro (lote de 3) ✓ concluída

- [x] **Condições de Pagamento** (RF05), **Formas de Pagamento**, **Parcelas** (RF06).

> **Backend concluído:** CRUDs em 4 camadas com testes TDD (service unitário, repository
> rollback, routes supertest); soft delete e HasDependents para cada entidade; hierarquia
> CondicaoDePagamento → Parcelas (com validação de CondicaoPagamento e FormaDePagamento no service).
>
> **Frontend concluído:** telas de Condições de Pagamento (com botão "Parcelas" para navegação
> hierárquica), Formas de Pagamento e Parcelas (filtradas por condição via query param
> `codCondDePag`, breadcrumb e select de FormasDePagamento no formulário); menu lateral com
> seção Financeiro. Seed atualizado com 3 condições, 4 formas e 6 parcelas.
>
> **▶ Próximo passo:** Fase 3B — Contas a Pagar (RF11) e Contas a Receber (RF12).

## Fase 3B — Contas a Pagar e Contas a Receber

- [x] **Contas a Pagar** (RF11) — referencia Fornecedores, FormaDePagamento; chave natural
      (`numero`, `modelo`, `serie`, `parcela`); `registrarBaixa`/`cancelar` dedicados.
- [x] **Contas a Receber** (RF12) — referencia Clientes, FormaDePagamento; mesmo padrão de
      chave natural e `registrarBaixa`/`cancelar`.

> **Backend concluído:** CRUDs em 4 camadas com testes TDD para as duas entidades (service
> unitário, repository rollback, routes supertest); `RegistrarBaixa`/`Cancelar` como operações
> dedicadas (não passam pelo `Update`); RN de bloqueio (não baixar conta cancelada, não
> cancelar conta já baixada).
>
> **▶ Próximo passo:** Frontend de Fase 3B (T-115A — telas de Contas a Pagar e Contas a
> Receber), depois Fase OS.

## Fase OS — Ordem de Serviço ⭐ módulo central da Kaneko Informática

A **Ordem de Serviço** é o coração operacional da Kaneko Informática e deve ser
implementada logo após a Fase 3B, antes dos fluxos transacionais complexos.

Ciclo de vida de uma OS:

```
Abertura → Diagnóstico → Execução (serviços + peças) → Aprovação do cliente
         → Encerramento (cobrança) → Entrega do equipamento
```

Campos principais (a detalhar no modelo de domínio):

- **Equipamento:** tipo, marca, modelo, número de série, defeito relatado, senha.
- **Cliente** responsável (referencia `Clientes`).
- **Técnico** responsável (referencia `Users`).
- **Status:** Aberta | Em Diagnóstico | Aguardando Aprovação | Em Execução |
  Aguardando Peça | Pronta | Entregue | Cancelada.
- **Serviços executados:** descrição e valor por linha de serviço.
- **Peças utilizadas:** referencia `Produtos` + quantidade + valor unitário.
- **Valor total** da OS (serviços + peças).
- **Condição de Pagamento** (referencia `CondicaoDePagamento`).
- **Prazo de entrega previsto** e data real de entrega.
- **Garantia** (dias corridos a partir da entrega).
- **Observações internas** e **laudo técnico**.

Dependências:

```
Clientes + Produtos + CondicaoDePagamento + Users → OrdemDeServico
OrdemDeServico → ContasAReceber (ao encerrar)
```

- [ ] **Backend:** migration + model + schema Zod + service (TDD) + repository +
      controller + routes.
- [ ] **Frontend:** listagem com filtro por status, formulário em modal (abertura),
      tela de detalhes com linha de serviços/peças e avanço de status.

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
