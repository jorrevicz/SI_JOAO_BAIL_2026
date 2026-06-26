# 04 — Requisitos

Fonte: `documentação-do-sistema.pdf`. Os requisitos funcionais correspondem aos
módulos do [Modelo de Domínio](05-modelo-de-dominio.md); os casos de uso e regras de
negócio detalhados estão em [Casos de Uso](07-casos-de-uso.md).

## Requisitos funcionais

Cada item abaixo é um módulo "Manter/Gerenciar" (CRUD + operações específicas):

| RF | Requisito | Subdomínio |
|----|-----------|-----------|
| RF01 | Manter cadastro de **Países** | [Localização](05-modelo-de-dominio.md#1-localização-geografia) |
| RF02 | Manter cadastro de **Estados** | [Localização](05-modelo-de-dominio.md#1-localização-geografia) |
| RF03 | Manter cadastro de **Cidades** | [Localização](05-modelo-de-dominio.md#1-localização-geografia) |
| RF04 | Manter cadastro de **Veículos** | [Logística](05-modelo-de-dominio.md#4-logística-e-veículos) |
| RF05 | Manter cadastro de **Condições de Pagamento** | [Financeiro](05-modelo-de-dominio.md#5-financeiro) |
| RF06 | Manter cadastro de **Parcelas** | [Financeiro](05-modelo-de-dominio.md#5-financeiro) |
| RF07 | Manter cadastro de **Fornecedores** | [Parceiros](05-modelo-de-dominio.md#2-parceiros-de-negócio) |
| RF08 | Manter cadastro de **Clientes** | [Parceiros](05-modelo-de-dominio.md#2-parceiros-de-negócio) |
| RF09 | Manter cadastro de **Produtos** (inclui categorias; NCM/SH fora de escopo) | [Produtos](05-modelo-de-dominio.md#3-produtos-e-catálogo) |
| RF10 | Manter cadastro de **Transportadoras** (inclui veículos) | [Parceiros](05-modelo-de-dominio.md#2-parceiros-de-negócio) / [Logística](05-modelo-de-dominio.md#4-logística-e-veículos) |
| RF11 | Manter **Contas a Pagar** | [Financeiro](05-modelo-de-dominio.md#5-financeiro) |
| RF12 | Manter **Contas a Receber** | [Financeiro](05-modelo-de-dominio.md#5-financeiro) |
| RF13 | Realizar e Gerenciar **Compras** | [Compras](05-modelo-de-dominio.md#6-compras) |
| RF14 | Gerenciar **Nota Fiscal Eletrônica** | [Fiscal](05-modelo-de-dominio.md#7-fiscal-nf-e) |
| RF15 | **Gerenciamento de Usuários e Cadastro** | [Acesso](05-modelo-de-dominio.md#8-acesso-e-usuários) |

## Requisitos não funcionais

| RNF | Requisito | Onde é tratado |
|-----|-----------|----------------|
| RNF01 | Todas as telas devem ser **responsivas** (desktop e mobile). | [Stack](03-stack-tecnologica.md) (styled-components) |
| RNF02 | Tempo de resposta das consultas **≤ 2 segundos**. | [Arquitetura](02-arquitetura.md) |
| RNF03 | **Autenticação obrigatória** em todos os módulos, exceto login/cadastro. | [Segurança](08-seguranca-e-autenticacao.md) |
| RNF04 | **Logs de auditoria** para toda inserção, alteração e exclusão. | [Segurança](08-seguranca-e-autenticacao.md) |
| RNF05 | Proteção contra **SQL Injection, XSS e CSRF**. | [Segurança](08-seguranca-e-autenticacao.md) |
| RNF06 | Transações críticas (compras, NF, contas) devem ser **atômicas** (rollback em falha). | [Arquitetura](02-arquitetura.md) |
| RNF07 | Mensagens de erro e sucesso **claras e em português**. | Convenção global (ver [README](README.md#convenções)) |
| RNF08 | Compatibilidade com **navegadores modernos** (Chrome, Edge, Firefox). | [Stack](03-stack-tecnologica.md) |
| RNF09 | Integração com **banco relacional** conforme DER/diagrama de classes. | [Modelo de Dados](06-modelo-de-dados.md) |
| RNF10 | Suporte à **emissão de Nota Fiscal Eletrônica**. | [Fiscal](05-modelo-de-dominio.md#7-fiscal-nf-e) |
| RNF11 | Código com **clean code** e documentação inline. | Convenção de código |
| RNF12 | Sistema deve permitir **fácil extensão de novos módulos**. | [Arquitetura](02-arquitetura.md) (modularização por subdomínio) |

## Documentos relacionados

- [Casos de Uso](07-casos-de-uso.md) — detalhamento de atores, pré/pós-condições e regras de negócio (RN).
- [Modelo de Domínio](05-modelo-de-dominio.md) — entidades e operações que realizam cada RF.
- [Roadmap](09-roadmap.md) — ordem de implementação dos requisitos funcionais.
