# 06 — Modelo de Dados

Esquema relacional que materializa o [Modelo de Domínio](05-modelo-de-dominio.md) no
PostgreSQL via **Prisma** (ver [Stack](03-stack-tecnologica.md)). Atende ao
[RNF09](04-requisitos.md#requisitos-não-funcionais) (integração com banco relacional
conforme DER) e ao requisito de **formas normais**.

> O schema Prisma em `/Backend/DB` é a fonte de verdade executável; este documento é a
> referência conceitual.

## Princípios de modelagem

- **Formas normais (até 3FN):** sem grupos repetitivos (1FN); todos os atributos não-chave
  dependem da chave inteira (2FN); sem dependências transitivas (3FN).
- **Relações N:N via tabelas associativas:** `ProdutoFornecedor`, `ProdutoCategoria`,
  `CompraProduto`, `ProdutoNfe`, `VeiculoNfe`.
- **Chaves substitutas:** cada entidade tem um identificador próprio (`codX` / `*_id`).
- **Auditoria denormalizada de forma controlada:** `dtCriacao`, `dtEdicao`, `codUser`,
  `isActive` repetem-se por entidade por serem metadados de linha, não dados de domínio
  (ver [Segurança](08-seguranca-e-autenticacao.md#auditoria)).

> **Pendência de normalização:** algumas associativas do diagrama carregam atributos
> redundantes copiados da entidade-pai (ex.: `CompraProduto.produto`,
> `ProdutoCategoria.categoria`, `VeiculoNfe.modelo/numSerie`). Na implementação devem
> ser substituídos por FKs puras para respeitar a 3FN. Ver [Roadmap](09-roadmap.md).

## Tabelas e chaves

Legenda: **PK** chave primária · **FK** chave estrangeira.

### Localização
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Paises` | `codPais` | — | `sigla`, `ddi`, `moeda` |
| `Estados` | `codEstado` | → `Paises` | `uf` |
| `Cidades` | `codCidade` | `codEstado` → `Estados` | |

### Parceiros
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Fornecedores` | `codForn` | `codCidade` → `Cidades` | `cpfCnpj`, `inscEstSubTrib` |
| `Clientes` | `cl_id` | `cidade_id` → `Cidades`, `cond_pag_id` → `CondicaoDePagamento` | |
| `Transportadoras` | `codTransp` | `codCidade` → `Cidades`, `codVeiculo` → `Veiculos` | `cpfCnpjTransp` |

### Produtos e Catálogo
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Produtos` | `codProd` | `codNcmSH` → `NCM_SH`, `codCategoria` → `Categorias` | `saldoProd`, `custoMedioProd` |
| `Categorias` | `codCategoria` | — | |
| `NCM_SH` | `codProd`* | `codEstado` → `Estados` | classificação fiscal |
| `ProdutoCategoria` | (`codProduto`,`codCategoria`) | → `Produtos`, → `Categorias` | associativa N:N |
| `ProdutoFornecedor` | (`codProd`,`codForn`) | → `Produtos`, → `Fornecedores` | associativa N:N |

\* O diagrama usa `codProd` como identificador em `NCM_SH`; avaliar PK própria `codNcmSH`
na implementação (ver pendência de normalização).

### Logística
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Veiculos` | `codVeiculo` | `codEstado` → `Estados` | `placaVeiculo`, `codAntt` |
| `VeiculoNfe` | (`codNfe`,`codVeiculo`) | → `NotasFiscaisEletronicas`, → `Veiculos`, → `Fornecedores` | associativa N:N |

### Financeiro
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `CondicaoDePagamento` | `codCondDePag` | — | juros, multa, desconto |
| `FormaDePagamento` | `codFormaDePag` | — | `prazoCompensacao` |
| `Parcelas` | `codParcela` | `codCondDePag` → `CondicaoDePagamento`, `codFormaDePag` → `FormaDePagamento` | `percentual`, `numDias` |
| `ContasAPagar` | `codContasAPag` | `codFornecedor` → `Fornecedores`, `codParcela` → `Parcelas`, `codNfe` → `NotasFiscaisEletronicas` | `vencFatura`, `vlrFatura` |
| `ContasAReceber` | `codContasARec` | `codCliente` → `Clientes`, `codFormaDePag` → `FormaDePagamento`, `codNfe` → `NotasFiscaisEletronicas` | `vencRecibo`, `vlrRecibo` |

### Compras
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Compras` | `codCompra` | `codForn` → `Fornecedores`, `codTransp` → `Transportadoras`, `codCondDePag` → `CondicaoDePagamento`, `codNfe` → `NotasFiscaisEletronicas` | |
| `CompraProduto` | (`codCompra`,`codProduto`) | → `Compras`, → `Produtos` | associativa N:N com qtd/custo |

### Fiscal
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `NotasFiscaisEletronicas` | `codNfe` | `codFornecedor` → `Fornecedores`, `codTransportadora` → `Transportadoras`, `codVeiculo` → `Veiculos`, `codProduto` → `Produtos` | `chaveAcessoNfe`, campos tributários |
| `ProdutoNfe` | (`codNfe`,`codProduto`) | → `NotasFiscaisEletronicas`, → `Produtos` | itens da nota (ICMS/IPI por item) |

### Acesso
| Tabela | PK | FKs | Observações |
|--------|----|-----|-------------|
| `Users` | `codUser` | — | `perfil`, `email`, `senha` (`tenha` no diagrama) |

`Users.codUser` é referenciado por `codUser` em praticamente todas as tabelas como
metadado de auditoria.

## Integridade referencial e exclusão

As regras de negócio (RN002 dos [Casos de Uso](07-casos-de-uso.md)) determinam que
**não se exclui um registro que possua dependentes** (ex.: país com estados, produto em
compras). Isso se traduz em:

- FKs com `ON DELETE RESTRICT` (ou bloqueio na camada de serviço), **ou**
- exclusão lógica via `isActive = false` (soft delete) — preferível para preservar
  histórico fiscal/financeiro.

## Relacionamentos N:N (resumo)

| Relação | Tabela associativa |
|---------|--------------------|
| Produto ↔ Fornecedor | `ProdutoFornecedor` |
| Produto ↔ Categoria | `ProdutoCategoria` |
| Compra ↔ Produto | `CompraProduto` |
| NF-e ↔ Produto | `ProdutoNfe` |
| NF-e ↔ Veículo | `VeiculoNfe` |

## Scripts de seed

`/Backend/DB` deve conter scripts para **alimentar o banco** (ver
[Roadmap](09-roadmap.md)), priorizando os cadastros básicos (Países → Estados →
Cidades) que são pré-requisito dos demais.

## Documentos relacionados

- [Modelo de Domínio](05-modelo-de-dominio.md) — atributos e operações de cada tabela.
- [Arquitetura](02-arquitetura.md) — camada de repositórios/Prisma.
- [Segurança](08-seguranca-e-autenticacao.md) — campos de auditoria.
- [Glossário](10-glossario.md) — termos fiscais dos campos tributários.
