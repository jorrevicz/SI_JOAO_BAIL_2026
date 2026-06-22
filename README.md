# SI_JOAO_BAIL_2026
Sistema web api para gerenciamento de operações como: cadastro, compra e venda. Possui o escopo definido para uma empresa pequena com a finalidade de ofertar tais serviços digitalmente ( e-commerce ). 

Esta pasta contém a **especificação arquitetural** do sistema, separada por escopo.
Cada documento aborda um aspecto específico e referencia os demais sempre que há
interdependência. Use este índice como ponto de partida.

> Fontes desta base: o **Diagrama de Classes** (`Sistema de Compras - Diagrama de
> Classes.png`) e a **Documentação do Sistema** (`documentação-do-sistema.pdf`),
> ambos localizados nas referências junto com os documentos, somados às definições de projeto acordadas.

## Stack tecnológica

Aplicação **Web API REST + SPA** na stack **PERN**, em **TypeScript** de ponta a ponta.
Racional e detalhes em [Stack Tecnológica](/docs/03-stack-tecnologica.md).

| Camada | Tecnologias |
|--------|-------------|
| **Linguagem** | TypeScript |
| **Backend** | Node.js · Express · **postgres.js** (driver SQL, sem ORM) · node-pg-migrate · kanel |
| **Banco de dados** | PostgreSQL (modelado em formas normais) |
| **Frontend** | React · Vite · styled-components · TanStack Table · Context API (estado) · React Router |
| **Testes** | Vitest |
| **Paradigma** | Programação Orientada a Objetos · API REST · transações atômicas |

## Estrutura do projeto

```
SI_JOAO_BAIL_2026/
├── Backend/              # API REST (Node + Express + TypeScript) — desenvolvida primeiro
│   └── src/
│       ├── db/           # migrations SQL (node-pg-migrate), tipos (kanel) e seed
│       ├── lib/          # cliente postgres.js compartilhado
├── Frontend/             # SPA (React + Vite + styled-components) — ainda não inicializado
│   └── src/
        ├── /services     # clientes HTTP (axios); um arquivo por domínio de API
├── docs/                 # base de conhecimento (especificação arquitetural)
├── CLAUDE.md             # guia para o Claude Code ao trabalhar no projeto
└── README.md             # este arquivo
```

> **Estado atual:** apenas `docs/` e `CLAUDE.md` existem. `Backend/` e `Frontend/`
> serão criados conforme o [Roadmap](/docs/09-roadmap.md) e o
> [Backlog](/docs/11-backlog.md) — desenvolvimento **backend-first**.
> Estrutura e camadas detalhadas em [Arquitetura](/docs/02-arquitetura.md).

## Índice

| # | Documento | Escopo |
|---|-----------|--------|
| 01 | [Visão Geral](/docs/01-visao-geral.md) | Contexto de negócio, objetivo, escopo do MVP e limites |
| 02 | [Arquitetura](/docs/02-arquitetura.md) | Estilo arquitetural (PERN/REST), camadas, estrutura de diretórios e princípios |
| 03 | [Stack Tecnológica](/docs/03-stack-tecnologica.md) | Ferramentas, bibliotecas e decisões técnicas |
| 04 | [Requisitos](/docs/04-requisitos.md) | Requisitos funcionais e não funcionais |
| 05 | [Modelo de Domínio](/docs/05-modelo-de-dominio.md) | Entidades, atributos e operações por subdomínio (diagrama de classes) |
| 06 | [Modelo de Dados](/docs/06-modelo-de-dados.md) | Esquema relacional, normalização, chaves e relacionamentos |
| 07 | [Casos de Uso](/docs/07-casos-de-uso.md) | Casos de uso, atores e regras de negócio |
| 08 | [Segurança e Autenticação](/docs/08-seguranca-e-autenticacao.md) | Autenticação, perfis, auditoria e proteções |
| 09 | [Roadmap de Implementação](/docs/09-roadmap.md) | Prioridades, fases e ordem de entrega dos CRUDs |
| 10 | [Glossário](/docs/10-glossario.md) | Termos de domínio e fiscais (NCM/SH, CFOP, ICMS, etc.) |
| 11 | [Backlog](/docs/11-backlog.md) | Épicos e tasks por fase (EP-00 a EP-13+) |
| 12 | [Princípios de Engenharia](/docs/12-principios-de-engenharia.md) | O que adotar e dispensar por categoria |

## Como navegar

- Comece por **[Visão Geral](/docs/01-visao-geral.md)** para entender o porquê do sistema.
- **[Arquitetura](/docs/02-arquitetura.md)** + **[Stack](/docs/03-stack-tecnologica.md)** descrevem o *como* técnico.
- **[Modelo de Domínio](/docs/05-modelo-de-dominio.md)** e **[Modelo de Dados](/docs/06-modelo-de-dados.md)**
  são a referência central para implementação — todos os outros documentos apontam para eles.
- **[Roadmap](/docs/09-roadmap.md)** define a ordem prática de construção, e o

## Convenções

- Idioma da documentação, mensagens de UI e comentários de código: **português**.
- Nomes de entidades e atributos seguem o diagrama de classes original (ver
  [Modelo de Domínio](/docs/05-modelo-de-dominio.md) para a grafia oficial, inclusive
  divergências conhecidas a normalizar).
