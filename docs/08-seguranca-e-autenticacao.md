# 08 — Segurança e Autenticação

Consolida os requisitos de segurança ([RNF03–RNF05](04-requisitos.md#requisitos-não-funcionais)),
a regra transversal **RN001** ([Casos de Uso](07-casos-de-uso.md#regras-de-negócio-transversais))
e o módulo de usuários ([Users](05-modelo-de-dominio.md#users)).

## Autenticação (RN001 / RNF03)

- **Autenticação obrigatória** em todos os módulos, exceto as telas de **login** e
  **registro/cadastro**.
- O fluxo de login e o método concreto (sessão, JWT, etc.) têm **decisão adiada** —
  ver [Visão Geral](01-visao-geral.md#fora-de-escopo-por-enquanto) e
  [Roadmap](09-roadmap.md). O modelo já prevê o suporte via [Users](05-modelo-de-dominio.md#users).

### Operações de conta ([Users](05-modelo-de-dominio.md#users))
`entrarConta()`, `sairConta()`, `registrarConta()`, `editarConta()`, `mudarSenha()`,
`excluirConta()`.

## Reautenticação para cancelamento (RN003)

Além da sessão ativa exigida por RN001, toda operação de **cancelamento** —
`cancelarCompra()`, `cancelarContaPagar()`, `cancelarContaReceber()`,
`cancelarNotaFiscal()` e o cancelamento de parcela — exige que o usuário
**reautentique** (informe a senha novamente) imediatamente antes de confirmar a
ação, mesmo com sessão ativa. O objetivo é um segundo fator de confirmação para uma
ação destrutiva sobre documentos financeiros/fiscais, não uma nova sessão completa.

- **Backend:** a rota de cancelamento exige, além do `authMiddleware`, a senha atual
  do usuário no corpo da requisição; a senha é validada antes de executar
  `cancelarX()` — falha retorna 401.
- **Frontend:** o formulário de cancelamento pede a senha num passo de confirmação
  antes de habilitar o botão de confirmar.
- Ver [Casos de Uso](07-casos-de-uso.md#regras-de-negócio-transversais) (RN003) para
  a lista completa de operações afetadas.

## Atores e perfis

O atributo `Users.perfil` define o papel do usuário. Atores previstos
(ver [Casos de Uso](07-casos-de-uso.md)):

| Ator | Acesso |
|------|--------|
| **Visitante Anônimo** | Pode registrar conta e acessar **recursos limitados** (RN001 do gerenciamento de usuário). |
| **Usuário** | Acesso completo aos cadastros, compras, contas e NF após autenticação. |
| **Fornecedor / Cliente / Transportadora** | Participam de **fluxos específicos** da [Nota Fiscal](07-casos-de-uso.md#gerenciar-nota-fiscal) (solicitar, confirmar entrega/recebimento, dados de transporte). |

## Auditoria (RNF04)

- **Logs de auditoria** para toda operação de **inserção, alteração e exclusão**.
- Suportado no modelo pelos campos por entidade (ver
  [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem)):
  - `codUser` — quem executou a operação.
  - `dtCriacao` / `dtEdicao` — quando.
  - `isActive` — exclusão lógica (soft delete), preservando histórico para fins
    fiscais e financeiros.

## Proteções de aplicação (RNF05)

| Ameaça | Mitigação recomendada |
|--------|----------------------|
| **SQL Injection** | Acesso a dados via **postgres.js** com *tagged template literals* (valores sempre parametrizados); identificadores dinâmicos só por whitelist com `sql()`; nunca concatenar SQL. |
| **XSS** | Escapar/validar saída no React; sanitizar entradas. |
| **CSRF** | Tokens anti-CSRF e/ou política de cookies `SameSite`; CORS restrito à origem do frontend. |

## Atomicidade de operações sensíveis (RNF06)

Operações críticas — **compras, notas fiscais e contas** — devem rodar em **transação**
com rollback total em caso de falha (ver [Arquitetura](02-arquitetura.md#princípios)).

## Documentos relacionados

- [Requisitos](04-requisitos.md) — RNF03–RNF06.
- [Casos de Uso](07-casos-de-uso.md) — RN001–RN003 e fluxos por ator.
- [Modelo de Domínio](05-modelo-de-dominio.md#9-acesso-e-usuários) — entidade `Users`.
- [Modelo de Dados](06-modelo-de-dados.md) — campos de auditoria.
