# 01 — Visão Geral

## Contexto de negócio

O cliente é uma **empresa pequena de informática** que atualmente **não possui
sistema**. As operações são feitas de forma manual/informal, e o objetivo é
informatizar o negócio com uma aplicação web própria.

## Objetivo

Implementar um sistema de gestão para a empresa cobrindo três operações centrais:

1. **Cadastro** — manter os dados de base (geografia, parceiros, produtos, etc.).
2. **Compra** — registrar compras de fornecedores e a entrada de mercadoria.
3. **Venda** — registrar saída de mercadoria para clientes.

> Login, fluxo de venda e fluxo de compra completos têm o **detalhamento final
> adiado** (a decidir em fase posterior) — ver [Roadmap](09-roadmap.md). O modelo de
> dados, no entanto, já é projetado para comportá-los.

## Natureza do sistema

Embora o negócio seja simples, o modelo documentado (ver
[Modelo de Domínio](05-modelo-de-dominio.md)) é o de um **ERP enxuto** com módulos
fiscais brasileiros (Nota Fiscal Eletrônica, NCM/SH, ICMS, IPI, CFOP, CSOSN). Esse
alcance vem do diagrama de classes original. A estratégia de entrega
(ver [Roadmap](09-roadmap.md)) é **pragmática**: construir primeiro os cadastros
básicos e as consultas, deixando os módulos fiscais e transacionais para depois.

## Escopo do MVP

Em ordem de prioridade (detalhada em [Roadmap](09-roadmap.md)):

- **Backend primeiro**, depois frontend.
- **Banco de dados** modelado nas formas normais e populado por scripts de seed.
- **CRUDs** entregues em lotes de três módulos, começando pelos mais básicos.
- Dentro de cada CRUD, as **consultas (Read)** vêm primeiro; as demais operações
  (Create/Update/Delete) depois.

## Fora de escopo (por enquanto)

- Integração real com a SEFAZ para emissão de NF-e (o sistema modela a NF-e, mas a
  emissão autorizada junto ao fisco não está no escopo inicial).
- Gateway de pagamento / cobrança online.
- Fluxos de login e de compra/venda end-to-end (decisão adiada).

## Atores

| Ator | Papel |
|------|-------|
| **Usuário** | Operador autenticado do sistema (administra cadastros, compras, contas, NF). |
| **Visitante Anônimo** | Pode registrar conta e acessar recursos limitados. |
| **Fornecedor** | Participa de fluxos específicos da Nota Fiscal (fornecer, solicitar). |
| **Cliente** | Participa de fluxos específicos da Nota Fiscal (confirmar recebimento). |
| **Transportadora** | Participa de fluxos de transporte/entrega da Nota Fiscal. |

Detalhamento de papéis e permissões em
[Segurança e Autenticação](08-seguranca-e-autenticacao.md) e os fluxos em
[Casos de Uso](07-casos-de-uso.md).

## Documentos relacionados

- [Arquitetura](02-arquitetura.md) — como o sistema é estruturado tecnicamente.
- [Requisitos](04-requisitos.md) — o que o sistema deve fazer.
- [Roadmap](09-roadmap.md) — em que ordem será construído.
