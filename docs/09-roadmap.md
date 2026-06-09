# 09 — Roadmap de Implementação

Ordem prática de construção, derivada das **prioridades de projeto**. Os módulos
referem-se ao [Modelo de Domínio](05-modelo-de-dominio.md) e os requisitos ao
[documento de Requisitos](04-requisitos.md).

## Princípios de entrega

1. **Backend primeiro**, depois frontend.
2. **CRUDs em lotes de três** ("revezamento três em três") — começando pelos mais
   básicos, para agilizar e evitar complexidade.
3. **Consultas (Read) primeiro**, depois as demais operações (Create/Update/Delete)
   de cada módulo.
4. **Criar o banco**, depois **scripts de seed**, depois **integrar** o backend às
   consultas.
5. **Login, compra e venda** completos: decisão e detalhamento **adiados**.

## Fase 0 — Fundação

- [ ] Estrutura de diretórios (`/Backend/DB`, `/Backend/src`, `/Frontend/src`) —
      ver [Arquitetura](02-arquitetura.md#estrutura-de-diretórios-raiz-do-projeto).
- [ ] Configurar **Prisma + Local Prisma Postgres** ([Stack](03-stack-tecnologica.md)).
- [ ] Modelar o schema do banco em formas normais
      ([Modelo de Dados](06-modelo-de-dados.md)).
- [ ] Scripts de **seed** para os cadastros básicos.
- [ ] Padronizar nomes (corrigir grafias do diagrama — ver
      [nota de grafia](05-modelo-de-dominio.md#convenções-de-atributos-comuns)).

## Fase 1 — Cadastros básicos (lote de 3)

Pré-requisito de todo o resto (geografia). Implementar **consultas primeiro**.

1. **Países** (RF01)
2. **Estados** (RF02)
3. **Cidades** (RF03)

## Fase 2 — Catálogo e parceiros (lotes de 3)

- Lote 2A: **Categorias**, **NCM/SH**, **Produtos** (RF09) — inclui vínculos NCM/SH e categoria.
- Lote 2B: **Fornecedores** (RF07), **Clientes** (RF08), **Transportadoras** (RF10).
- **Veículos** (RF04) entra junto das transportadoras (dependência logística).

## Fase 3 — Financeiro (lote de 3)

- **Condições de Pagamento** (RF05), **Parcelas** (RF06), **Formas de Pagamento**.
- Em seguida: **Contas a Pagar** (RF11) e **Contas a Receber** (RF12).

## Fase 4 — Transacional

- **Compras** (RF13) — operação atômica
  ([RNF06](04-requisitos.md#requisitos-não-funcionais)).
- **Nota Fiscal Eletrônica** (RF14, RNF10) — depende de compras e do módulo fiscal.

## Fase 5 — Acesso e fluxos adiados

- **Gerenciamento de Usuários** e **Login** (RF15) —
  ver [Segurança](08-seguranca-e-autenticacao.md).
- Fluxos completos de **compra** e **venda** (a decidir).

## Fase 6 — Frontend

- SPA React consumindo a API, na mesma ordem dos módulos do backend.
- Telas responsivas ([RNF01](04-requisitos.md#requisitos-não-funcionais)).

## Dependências entre módulos

```
Países → Estados → Cidades → { Fornecedores, Clientes, Transportadoras, Veículos }
NCM/SH + Categorias → Produtos
Cond. Pagamento → Parcelas → { Contas a Pagar, Contas a Receber }
Fornecedores + Produtos + Cond. Pagamento + Transportadoras → Compras → NF-e
```

> Sempre cadastrar o "pai" antes do "filho" — daí Países/Estados/Cidades virem primeiro.

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RFs entregues em cada fase.
- [Modelo de Domínio](05-modelo-de-dominio.md) — entidades de cada módulo.
- [Modelo de Dados](06-modelo-de-dados.md) — schema e seeds da Fase 0.
