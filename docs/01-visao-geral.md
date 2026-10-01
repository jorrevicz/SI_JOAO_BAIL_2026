# 01 — Visão Geral

## Contexto de negócio

O cliente é a **Kaneko Informática**, empresa pequena de **assistência técnica e
revenda de produtos de informática** que atualmente **não possui sistema**. As
operações são feitas de forma manual/informal, e o objetivo é informatizar o
negócio com uma aplicação web própria.

A principal atividade da empresa é a **prestação de serviços de reparo e
manutenção de equipamentos** (computadores, notebooks, periféricos), registrada
por meio de **Ordens de Serviço (OS)**. A revenda de produtos e os fluxos de
compra de fornecedores são atividades complementares.

## Objetivo

Implementar um sistema de gestão para a Kaneko Informática cobrindo as operações:

1. **Cadastro** — manter os dados de base (geografia, parceiros, produtos, etc.).
2. **Ordem de Serviço (OS)** — registrar a entrada de equipamentos, acompanhar o
   ciclo de atendimento (diagnóstico → reparo → entrega) e controlar os serviços e
   peças utilizados. **Módulo central do negócio.**
3. **Compra** — registrar compras de fornecedores e a entrada de mercadoria/peças.
4. **Financeiro** — contas a pagar, contas a receber, condições e formas de pagamento.

> Login, fluxo de venda e fluxo de compra completos têm o **detalhamento final
> adiado** (a decidir em fase posterior) — ver [Roadmap](09-roadmap.md). O modelo de
> dados, no entanto, já é projetado para comportá-los.

## Natureza do sistema

Embora o negócio seja de pequeno porte, o modelo documentado (ver
[Modelo de Domínio](05-modelo-de-dominio.md)) é o de um **ERP enxuto** com módulos
fiscais brasileiros (Nota Fiscal Eletrônica, ICMS, IPI, CFOP, CSOSN) e gestão de
OS. Esse alcance vem do diagrama de classes original. A classificação fiscal
**NCM/SH foi descartada** do escopo (a parte tributária de classificação de
mercadoria não será implementada). A estratégia de entrega (ver
[Roadmap](09-roadmap.md)) é **pragmática**: construir primeiro os cadastros básicos
e os módulos financeiros, chegando em seguida à **Ordem de Serviço** — que é o
coração operacional da Kaneko Informática — e por último os módulos fiscais e
transacionais mais complexos.

## Escopo do MVP

Em ordem de prioridade (detalhada em [Roadmap](09-roadmap.md)):

- **Backend primeiro**, depois frontend.
- **Banco de dados** modelado nas formas normais e populado por scripts de seed.
- **CRUDs** entregues em lotes de três módulos, começando pelos mais básicos.
- Dentro de cada CRUD, as **consultas (Read)** vêm primeiro; as demais operações
  (Create/Update/Delete) depois.
- **Ordem de Serviço** como módulo prioritário após os cadastros financeiros.

## Fora de escopo (por enquanto)

- Integração real com a SEFAZ para emissão de NF-e (o sistema modela a NF-e, mas a
  emissão autorizada junto ao fisco não está no escopo inicial).
- Gateway de pagamento / cobrança online.
- Fluxos de login e de compra/venda end-to-end (decisão adiada).

## Atores

| Ator | Papel |
|------|-------|
| **Usuário** | Operador autenticado do sistema (administra cadastros, OS, compras, contas, NF). |
| **Técnico** | Operador responsável pela execução dos serviços de reparo nas OS. |
| **Fornecedor** | Participa de fluxos específicos de compra e Nota Fiscal. |
| **Cliente** | Traz equipamentos para reparo (OS) e participa de fluxos da Nota Fiscal. |
| **Transportadora** | Participa de fluxos de transporte/entrega da Nota Fiscal. |

Detalhamento de papéis e permissões em
[Segurança e Autenticação](08-seguranca-e-autenticacao.md) e os fluxos em
[Casos de Uso](07-casos-de-uso.md).

## Documentos relacionados

- [Arquitetura](02-arquitetura.md) — como o sistema é estruturado tecnicamente.
- [Requisitos](04-requisitos.md) — o que o sistema deve fazer.
- [Roadmap](09-roadmap.md) — em que ordem será construído.
