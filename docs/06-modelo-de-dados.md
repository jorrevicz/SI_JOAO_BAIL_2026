# 06 — Modelo de Dados

Esquema relacional que materializa o [Modelo de Domínio](05-modelo-de-dominio.md) no
PostgreSQL, acessado por **postgres.js** e versionado por **node-pg-migrate** (ver
[Stack](03-stack-tecnologica.md)). Atende ao
[RNF09](04-requisitos.md#requisitos-não-funcionais) (integração com banco relacional
conforme DER) e ao requisito de **formas normais**.

> As **migrations SQL** em `/Backend/src/db/migrations` são a fonte de verdade executável do
> schema; este documento é a referência conceitual. Os tipos TypeScript das tabelas são
> gerados a partir do banco pelo **kanel**.

## Princípios de modelagem

- **Formas normais (até 3FN):** sem grupos repetitivos (1FN); todos os atributos não-chave
  dependem da chave inteira (2FN); sem dependências transitivas (3FN).
- **Relações N:N via tabelas associativas com FK puras:** `ProdutoFornecedor`,
  `ProdutoCategoria`, `CompraProduto`, `ProdutoNfe`, `VeiculoNfe` — nenhuma carrega
  atributos redundantes copiados da entidade-pai; a exceção justificada é
  `CompraProduto.custoMedioProduto`, que é dado histórico (custo no momento da compra,
  que pode divergir do custo médio atual).
- **Chaves substitutas:** cada entidade tem um identificador próprio auto-incrementado
  (`codX`). Esse mesmo `codX` serve como **cursor para paginação baseada em cursor**
  (*cursor-based pagination*) — sem uso de `OFFSET`.
- **Sufixo de contexto nos campos de endereço:** campos homônimos entre entidades
  (endereço, bairro, CEP, fone, CPF/CNPJ) recebem sufixo do subdomínio (`Forn`, `Cl`,
  `Transp`) para evitar ambiguidade em JOINs e respostas de API.
- **Dados sem máscara no banco:** CPF/CNPJ, CEP e telefone são armazenados como
  **dígitos puros**, sem pontuação ou formatação. A máscara de exibição é aplicada
  exclusivamente no front-end.
- **Tamanhos de campo explícitos:** todos os campos `String` possuem `@db.VarChar(n)`;
  a `chaveAcessoNfe` usa `@db.Char(44)` por ser sempre exatamente 44 dígitos.
- **NCM/SH fora do escopo:** a tabela `NCM_SH` foi removida do banco; o campo
  `codNcmSH` foi removido de `Produtos`. A classificação fiscal não é requisito do MVP.
- **Auditoria denormalizada de forma controlada:** `dtCriacao`, `dtEdicao`, `codUser`,
  `isActive` repetem-se por entidade — são metadados de linha, não dados de domínio
  (ver [Segurança](08-seguranca-e-autenticacao.md#auditoria)). `codUser` é `INTEGER`
  anulável sem FK formal até EP-10 ativar a autenticação.
- **Exclusão lógica (soft delete):** `isActive = false` — preserva histórico fiscal e
  financeiro; exclusão física bloqueada por `ON DELETE RESTRICT` nas FKs.
- **Datas de NF-e como `DateTime`:** `dhEmiNfe` e `dhSaiNfe` armazenam data e hora
  em campo único (tipo `DateTime`), substituindo os campos separados `dtEmissaoNfe`,
  `hrEmissaoNfe`, `dtSaidaNfe`, `hrSaidaNfe` que existiam no diagrama original.

## Tabelas e chaves

Legenda: **PK** chave primária · **FK** chave estrangeira.

### Localização
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Paises` | `codPais` | — | `sigla` (unique), `ddi`, `moeda` |
| `Estados` | `codEstado` | `codPais` → `Paises` | `uf` VarChar(2), `estado` VarChar(22) |
| `Cidades` | `codCidade` | `codEstado` → `Estados` | `cidade` VarChar(32), `ddd` VarChar(2) |

### Parceiros
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Fornecedores` | `codForn` | `codCidade` → `Cidades` | `nomeFantasia`, `enderecoForn`, `bairroForn`, `cepForn` (8 díg.), `foneForn`, `cpfCnpjForn` (14 díg.), `inscEstSubTrib` |
| `Clientes` | `codCliente` | `codCidade` → `Cidades`, `codCondDePag` → `CondicaoDePagamento` | `enderecoCl`, `bairroCl`, `cepCl` (8 díg.), `foneCl` |
| `Transportadoras` | `codTransp` | `codCidade` → `Cidades`, `codVeiculo` → `Veiculos` | `nomeFantasia`, `tipoPessoa`, `enderecoTransp`, `cpfCnpjTransp`, `inscEstTransp` |

### Produtos e Catálogo
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Produtos` | `codProd` | `codCategoria` → `Categorias` | `saldoProd` Decimal(10,3), `custoMedioProd` Decimal(10,2) |
| `Categorias` | `codCategoria` | — | `categoria` VarChar(40) |
| `ProdutoCategoria` | (`codProduto`, `codCategoria`) | → `Produtos`, → `Categorias` | associativa N:N — FK puras |
| `ProdutoFornecedor` | (`codProd`, `codForn`) | → `Produtos`, → `Fornecedores` | associativa N:N — FK puras |

### Logística
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Veiculos` | `codVeiculo` | `codEstado` → `Estados` | `modeloVeiculo`, `marca`, `placaVeiculo` VarChar(7), `placaMercoSul`, `codAntt` |
| `VeiculoNfe` | (`codNfe`, `codVeiculo`) | → `NotasFiscaisEletronicas`, → `Veiculos`, → `Fornecedores` | associativa N:N — `modelo`/`numSerie` removidos (redundantes com NF-e) |

### Financeiro
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `CondicaoDePagamento` | `codCondDePag` | — | `descricao` VarChar(60), `juroCondPag`, `multaCondPag`, `descontoCondPag` |
| `FormaDePagamento` | `codFormaDePag` | — | `formaDePag` VarChar(50), `prazoCompensacao` |
| `Parcelas` | `codParcela` | `codCondDePag` → `CondicaoDePagamento`, `codFormaDePag` → `FormaDePagamento` | `percentual` Decimal(5,2), `numDias` |
| `ContasAPagar` | `codContasAPag` | `codFornecedor` → `Fornecedores`, `codParcela` → `Parcelas`, `codNfe` → `NotasFiscaisEletronicas` | `vencFatura`, `vlrFatura` |
| `ContasAReceber` | `codContasARec` | `codCliente` → `Clientes`, `codFormaDePag` → `FormaDePagamento`, `codNfe` → `NotasFiscaisEletronicas` | `vencRecibo`, `vlrRecibo`, `dtPagamento` |

### Compras
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Compras` | `codCompra` | `codForn` → `Fornecedores`, `codTransp` → `Transportadoras`, `codCondDePag` → `CondicaoDePagamento`, `codNfe` → `NotasFiscaisEletronicas` | |
| `CompraProduto` | (`codCompra`, `codProduto`) | → `Compras`, → `Produtos` | `custoMedioProduto` — dado histórico (custo no momento da compra) |

### Fiscal
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `NotasFiscaisEletronicas` | `codNfe` | `codFornecedor` → `Fornecedores`, `codTransportadora` → `Transportadoras`, `codProduto` → `Produtos` | `chaveAcessoNfe` Char(44) unique, `fretePorConta` VarChar(20), `dhEmiNfe`/`dhSaiNfe` DateTime, campos tributários |
| `ProdutoNfe` | (`codNfe`, `codProduto`) | → `NotasFiscaisEletronicas`, → `Produtos` | itens da nota — ICMS/IPI por produto |

### Acesso
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Users` | `codUser` | — | `perfil` VarChar(14), `email` (unique), `senha` VarChar(22) |

`Users.codUser` é referenciado como `codUser Int?` (auditoria) em todas as tabelas. A
FK formal para `Users` será ativada em EP-10 (autenticação real).

## Integridade referencial e exclusão

As regras de negócio (RN002 dos [Casos de Uso](07-casos-de-uso.md)) determinam que
**não se exclui um registro que possua dependentes**. Isso se traduz em:

- Todas as FKs criadas com `ON DELETE RESTRICT` nas migrations SQL.
- Exclusão lógica via `isActive = false` (soft delete) — preferível para preservar
  histórico fiscal e financeiro.

## Relacionamentos N:N (resumo)

| Relação | Tabela associativa | FK puras |
|---------|--------------------|----------|
| Produto ↔ Fornecedor | `ProdutoFornecedor` | ✓ |
| Produto ↔ Categoria | `ProdutoCategoria` | ✓ |
| Compra ↔ Produto | `CompraProduto` | ✓ + `custoMedioProduto` (histórico) |
| NF-e ↔ Produto | `ProdutoNfe` | ✓ + campos tributários por item |
| NF-e ↔ Veículo | `VeiculoNfe` | ✓ |

## Scripts de seed

`/Backend/src/db/seed.ts` popula o banco de forma **idempotente** (`INSERT ... ON CONFLICT
DO NOTHING/UPDATE`), respeitando a ordem de dependências:

```
Paises → Estados → Cidades
Categorias → Produtos
Fornecedores → CondicaoDePagamento → Clientes
Veiculos → Transportadoras
ProdutoFornecedor (vínculo produto × fornecedor)
```

Dados armazenados sem máscara (CEP, CPF/CNPJ, fone em dígitos puros).

## Documentos relacionados

- [Modelo de Domínio](05-modelo-de-dominio.md) — atributos e operações de cada entidade.
- [Arquitetura](02-arquitetura.md) — camada de repositórios (postgres.js).
- [Segurança](08-seguranca-e-autenticacao.md) — campos de auditoria.
- [Glossário](10-glossario.md) — termos fiscais dos campos tributários.
