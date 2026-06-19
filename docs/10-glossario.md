# 10 — Glossário

Termos de domínio e fiscais usados no sistema, especialmente os campos tributários da
[Nota Fiscal Eletrônica](05-modelo-de-dominio.md#7-fiscal-nf-e). Referência para
entender os atributos do [Modelo de Domínio](05-modelo-de-dominio.md) e
[Modelo de Dados](06-modelo-de-dados.md).

## Termos de negócio

| Termo | Significado |
|-------|-------------|
| **Empresa** | O cliente do sistema: pequena empresa de informática com operações informais. Ver [Visão Geral](01-visao-geral.md). |
| **Cadastro** | Manutenção dos dados de base (CRUD). |
| **Compra** | Entrada de mercadoria comprada de um fornecedor ([módulo Compras](05-modelo-de-dominio.md#6-compras)). |
| **Venda** | Saída de mercadoria para um cliente (fluxo a detalhar). |
| **Saldo (`saldoProd`)** | Quantidade em estoque de um produto. |
| **Custo médio (`custoMedioProd`)** | Custo médio ponderado de aquisição do produto. |
| **Condição de Pagamento** | Conjunto de regras de juros/multa/desconto e parcelamento. |
| **Forma de Pagamento** | Meio de pagamento (dinheiro, cartão, etc.) com prazo de compensação. |
| **Parcela** | Fração de um pagamento, com percentual e prazo em dias. |
| **Conta a Pagar / a Receber** | Título financeiro a quitar (fornecedor) ou a receber (cliente). |

## Termos fiscais (Brasil)

| Sigla / Termo | Significado |
|---------------|-------------|
| **NF-e** | **Nota Fiscal Eletrônica** — documento fiscal digital de circulação de mercadoria. |
| **Chave de Acesso (`chaveAcessoNfe`)** | Código de 44 dígitos que identifica unicamente uma NF-e. |
| **Natureza da Operação (`naturezaOp`)** | Descrição da finalidade da operação (venda, compra, devolução, etc.). |
| **NCM/SH** | **Nomenclatura Comum do Mercosul / Sistema Harmonizado** — código de classificação fiscal da mercadoria. Ver [NCM_SH](05-modelo-de-dominio.md#ncm_sh-classificação-fiscal-de-mercadoria--ver-glossário). |
| **CFOP** (`cfoPfodNfe` / `prodCfopNfe`) | **Código Fiscal de Operações e Prestações** — classifica a natureza fiscal da operação. |
| **CSOSN** (`csosnProdNfe` / `prodCsosnNfe`) | **Código de Situação da Operação no Simples Nacional** — situação tributária para empresas do Simples. |
| **ICMS** | **Imposto sobre Circulação de Mercadorias e Serviços** — imposto estadual. |
| **Base de cálculo ICMS (`baseIcmsProdNfe` / `prodBcIcms`)** | Valor sobre o qual o ICMS incide. |
| **Alíquota ICMS (`aliqIcmsProdNfe`)** | Percentual do ICMS aplicado. |
| **ICMS-ST / Substituição (`calcIcmsSubs`, `vlrIcmsSubs`)** | ICMS por **substituição tributária** (recolhido antecipadamente por um contribuinte). |
| **IPI** | **Imposto sobre Produtos Industrializados** — imposto federal. |
| **Alíquota / Valor IPI (`aliqIpiProdNfe`, `vlrIpiProdNfe`)** | Percentual e valor do IPI. |
| **Inscrição Estadual (`inscEstadualNfe`, `inscEstTransp`, `inscEstSubTrib`)** | Registro do contribuinte na Secretaria da Fazenda estadual. |
| **CPF/CNPJ (`cpfCnpjNfe`, `cpfCnpj`, `cpfCnpjTransp`)** | Identificadores fiscais de pessoa física (CPF) e jurídica (CNPJ). |
| **Frete por conta (`fretePorConta`)** | Indica quem paga o frete (emitente ou destinatário). |
| **Código ANTT (`codAntt`)** | Registro do veículo/transportador na Agência Nacional de Transportes Terrestres. |
| **Modelo / Série (`modelo`, `numSerie`)** | Identificação do tipo e série do documento fiscal. |

## Termos técnicos

| Termo | Significado |
|-------|-------------|
| **PERN** | Stack PostgreSQL + Express + React + Node.js. Ver [Arquitetura](02-arquitetura.md). |
| **CRUD** | Create, Read, Update, Delete — as operações de manutenção de um cadastro. |
| **Soft delete (`isActive`)** | Exclusão lógica: marca o registro inativo em vez de apagá-lo. Ver [Segurança](08-seguranca-e-autenticacao.md#auditoria). |
| **Forma normal (1FN/2FN/3FN)** | Regras de normalização relacional. Ver [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem). |
| **Tabela associativa** | Tabela que materializa uma relação N:N. Ver [Modelo de Dados](06-modelo-de-dados.md#relacionamentos-nn-resumo). |
| **postgres.js** | Driver/cliente PostgreSQL para Node.js usado no acesso a dados (sem ORM). *Tagged template literals* parametrizam os valores, protegendo contra SQL Injection. Ver [Stack](03-stack-tecnologica.md). |
| **node-pg-migrate** | Ferramenta de *migrations* SQL versionadas; fonte de verdade do schema do banco. Ver [Stack](03-stack-tecnologica.md). |
| **kanel** | Gerador de tipos TypeScript a partir do schema do PostgreSQL (introspecção); repõe a tipagem sem ORM. Ver [Stack](03-stack-tecnologica.md). |
| **Migration** | Script SQL versionado que cria/altera o schema do banco de forma incremental e reversível (`up`/`down`). |
| **ACID** | Atomicidade, Consistência, Isolamento, Durabilidade — propriedades de transações; garantidas via `sql.begin` (RNF06). |
| **Transação / `sql.begin`** | Bloco de operações executadas atomicamente (tudo ou nada); falha causa *rollback*. Ver [Arquitetura](02-arquitetura.md#princípios). |
| **ORM / Query Builder** | Camadas de abstração sobre SQL. **Não usados** neste projeto: o acesso a dados é por SQL direto via postgres.js. |

## Documentos relacionados

- [Modelo de Domínio](05-modelo-de-dominio.md) — onde estes termos aparecem como atributos.
- [Modelo de Dados](06-modelo-de-dados.md) — colunas correspondentes.
