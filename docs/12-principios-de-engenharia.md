# 12 — Princípios de engenharia complementares

Este documento é a **casa única** das decisões sobre princípios de desenvolvimento de software
neste projeto e decide, **considerando o escopo
real**, o que **adotar**.

> **Escopo que baliza as decisões:** ERP enxuto para uma empresa de informática pequena (cadastro,
> compra, venda), **monolito de instância única**, Node/Express + postgres.js + PostgreSQL, frontend
> React. Baixo volume, um único banco, equipe pequena. Princípios que pressupõem sistema distribuído,
> múltiplos times ou alto volume **não** se justificam aqui.

---
### A adotar (encaixam no escopo, baixo custo)
---
Princípios que **agregam** valor real ao projeto. Cada um traz "Como se aplica aqui". São diretrizes
a observar quando o módulo/fase correspondente chegar.

### 1. Programação Orientada a Objetos (POO)

O domínio é modelado em classes (ver [Modelo de Domínio](05-modelo-de-dominio.md)), com responsabilidades encapsuladas. As operações listadas como métodos no diagrama de classes são o contrato de comportamento de cada entidade.

### 2. Banco de Dados em Formas Normais

O esquema relacional segue as formas normais (até a 3FN), com tabelas associativas para relações N:N — detalhado em [Modelo de Dados](06-modelo-de-dados.md).

### 3. REST
Recursos expostos por URLs previsíveis, verbos HTTP semânticos (GET/POST/PUT/DELETE) e respostas JSON.

### 4. Backend Primeiro

o backend e o banco são construídos e validados antes do frontend — ver [Roadmap](09-roadmap.md).

### 5. Separation of Concerns / Single Responsibility

Camadas `routes → controllers → services → repositories` — [02-arquitetura.md](02-arquitetura.md#camadas-sugeridas-do-backend-backendsrc).

### 6. TDD (Red→Green→Refactor) 

`CLAUDE.md` → "Princípios obrigatórios" item 8


### 7. Defensive Programming

 Middleware `validate` (Zod) no boundary + RNF05 — [04-requisitos.md](04-requisitos.md#requisitos-não-funcionais)

### 8. Atomicidade (ACID)

RNF06 + `withTransaction` — operações críticas (compras, notas fiscais, contas) rodam em transação com rollback em caso de falha.

### 9. Auditoria (alternativa pragmática ao Event Sourcing) 

`codUser`/`dtCriacao`/`dtEdicao`/`isActive` (soft delete) — [06-modelo-de-dados.md](06-modelo-de-dados.md)

### 10. Idempotência — *a contribuição mais relevante para este domínio*

Repetir a mesma operação não deve duplicar efeitos. O risco é concreto: um duplo-clique ou um
retry de rede pode gerar **compra, pagamento ou NF-e duplicados**.

- **Como se aplica aqui:** princípio a observar na **Fase 4** ([Compras](07-casos-de-uso.md) e
  Nota Fiscal Eletrônica). O **mecanismo** (ex.: chave de idempotência por requisição) fica **a
  definir** quando a fase chegar — aqui registramos apenas a diretriz: operações financeiras e de
  emissão de NF precisam ser seguras a repetição.
- **Não adotar agora** em CRUDs de cadastro (Países/Estados/Cidades/Produtos…): a unicidade por
  chave natural + `UPDATE` idempotente já cobre o caso, sem cerimônia extra (ver YAGNI abaixo).

### 11. DRY — de **conhecimento**, não de texto

Cada regra de negócio deve ter uma única representação autoritativa. O alvo é *conhecimento*
duplicado, não trechos superficialmente parecidos.

- **Como se aplica aqui:** centralizar **regras fiscais** (alíquotas de ICMS, mapeamento de CFOP,
  etc. — ver [10-glossario.md](10-glossario.md)) num único módulo na Fase 4, em vez de espalhar a
  mesma fórmula por vários fluxos. Igualmente: schemas Zod e DTOs reaproveitados, não recopiados.

### 12. YAGNI — não construir para um futuro hipotético

Não implementar hoje capacidade que só *talvez* seja necessária amanhã.

- **Como se aplica aqui:** contrapeso explícito ao DRY e alinhado à estratégia incremental
  ("CRUDs em lotes de três", consultas antes de mutações). Evitar hierarquias de estratégia,
  abstrações genéricas e "ganchos" sem um segundo caso real que os justifique.
- **Nota — tensão DRY ↔ YAGNI:** unifique quando duas partes expressam a **mesma regra de negócio**;
  **não** unifique código só porque "se parece". Abstração prematura custa mais que duplicação barata.

### 13. Fail Fast — falhar cedo e visível

Detectar estado inválido imediatamente, em vez de propagar erro silencioso.

- **Como se aplica aqui:** validar **configuração no boot** (ex.: abortar a subida da API se faltar
  `DATABASE_URL`) em vez de descobrir a ausência no meio de uma transação em produção. Casa com o
  `validate` (Zod) já existente, que falha no boundary antes de chegar ao service.

### 14. Least Privilege — privilégio mínimo

Cada usuário/processo recebe só a permissão necessária.

- **Como se aplica aqui:** diretriz para o **EP-10 (autenticação real)**. Os perfis
  (Usuário / Cliente / Fornecedor / Transportadora — ver
  [08-seguranca-e-autenticacao.md](08-seguranca-e-autenticacao.md)) devem receber o mínimo de acesso
  ao seu fluxo. No banco: a aplicação conecta com um usuário **sem superuser**, apenas com os
  privilégios de DML necessários.

### 15. CQS + Princípio do Menor Espanto (POLA)

Uma operação ou **altera** estado ou **consulta** dado — não ambos; e nomes/comportamentos
correspondem ao que se espera deles.

- **Como se aplica aqui:** formalizar a convenção já seguida informalmente nos services
  (`consultarX()` lê, `adicionarX()`/`editarX()`/`removerX()` mutam) e em rotas REST previsíveis.
  Um método ou rota nunca deve surpreender (ex.: um `GET` não muda estado; "remover" é soft delete
  e isso fica claro no nome/contrato).

### 16. Postel's Law — **leitura cautelosa** (rigor, não permissividade)

A formulação clássica ("seja liberal no que aceita") tem leitura moderna mais rígida para APIs de
negócio: tolerância excessiva cristaliza erros e amplia superfície de risco.

- **Como se aplica aqui:** **reforça** o Zod estrito — **rejeitar** entrada ambígua/inesperada no
  boundary, em vez de "tentar adivinhar". Aqui Postel entra como *advertência*, não como licença
  para aceitar qualquer payload.

---

## Resumo de uma linha

- **Adotar:** SoC/SRP, TDD, Defensive Programming, Atomicidade, Auditoria, 
  Idempotência (Fase 4), DRY de conhecimento (regras fiscais), YAGNI, Fail Fast,
  Least Privilege (EP-10), CQS+POLA, Postel cauteloso (Zod estrito).

