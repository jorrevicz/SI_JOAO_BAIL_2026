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
  que pode divergir do custo médio atual), e `CompraProduto.percentualRateio`/
  `valorRateio`, dado calculado por item a partir dos custos adicionais da própria
  compra (`frete`/`seguro`/`despesas`), não uma cópia de outra entidade.
- **Chaves substitutas:** cada entidade tem um identificador próprio auto-incrementado
  (`codX`). Esse mesmo `codX` serve como **cursor para paginação baseada em cursor**
  (*cursor-based pagination*) — sem uso de `OFFSET`. A exceção é `Compras`, que usa
  **chave primária composta natural** (`numero` VarChar(28), `modelo` VarChar(2),
  `serie` VarChar(2)) — o próprio documento de compra, sem `codCompra` substituto.
  `OrdemDeServicos` também dispensa `codOS` substituto, mas por outro motivo: `numOdS`
  não é uma chave natural informada — é um **UID gerado pelo banco** (`UUID`,
  `DEFAULT gen_random_uuid()`), já que a OS não tem um número de negócio digitável e
  legível (diferente do documento de compra).
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
- **Toda coluna de data/hora é `TimestampTz` (UTC), nunca `Timestamp` sem fuso:** um
  valor "sem fuso" depende implicitamente do `TimeZone` da sessão do Postgres para ser
  reinterpretado corretamente — frágil a um dump/restore ou a uma sessão com fuso
  diferente. Migration `todas-datas-com-timezone` converteu todas as colunas do schema
  (auditoria `dtCriacao`/`dtEdicao` e datas de negócio) de `Timestamp(3)` para
  `TimestampTz(3)`; qualquer coluna de data/hora nova nasce direto como `TimestampTz`.
  O Backend sempre retorna/recebe ISO 8601 em UTC (sufixo `Z`); o Frontend formata para
  exibição no padrão brasileiro `DD-MM-AAAA` (e `DD-MM-AAAA HH:mm` onde a hora é
  relevante) a partir dos componentes UTC da data, nunca do fuso do navegador — ver
  `formatarData`/`formatarDataHora` em `Frontend/src/utils/formatters.ts`.

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
| `Produtos` | `codProd` | — (a categoria é N:N, via `ProdutoCategoria`) | `estoque` INTEGER (def. 0), `saldoProd` Decimal(10,3), `custoMedioProd` Decimal(10,2) |
| `Categorias` | `codCategoria` | — | `categoria` VarChar(40) |
| `ProdutoCategoria` | (`codProduto`, `codCategoria`) | → `Produtos`, → `Categorias` | associativa N:N — FK puras, sem auditoria nem `isActive`; remoção é exclusão física. Índice `ProdutoCategoria_codCategoria_idx` cobre o caminho categoria → produtos |
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
| `ContasAPagar` | (`numero`, `modelo`, `serie`, `parcela`) | `codFornecedor` → `Fornecedores`, `codFormaDePag` → `FormaDePagamento` | `numero` VarChar(28), `modelo` VarChar(2), `serie` VarChar(2), `parcela` Int, `dtEmissao`/`dtVencimento` `TimestampTz(3)` obrigatórias (`dtVencimento` ≥ `dtEmissao`), `valor`, `juro`, `desconto`, `multa`, `valorBaixa`, `dtBaixa`, `justificativaCancelamento` VarChar(255) |
| `ContasAReceber` | (`numero`, `modelo`, `serie`, `parcela`) | `codCliente` → `Clientes`, `codFormaDePag` → `FormaDePagamento` | `numero` VarChar(28), `modelo` VarChar(2), `serie` VarChar(2), `parcela` Int, `dtEmissao`/`dtVencimento` `TimestampTz(3)` obrigatórias (`dtVencimento` ≥ `dtEmissao`), `dtPagamento`, `valor`, `juro`, `desconto`, `multa`, `valorBaixa`, `dtBaixa`, `justificativaCancelamento` VarChar(255) |

### Atendimento (Ordem de Serviço)
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Aparelhos` | `codAparelho` | — | `aparelho`/`serie` opcionais, `modelo`/`voltagem`/`garantia` obrigatórios — unidade física do cliente, nasce com a OS |
| `Equipamentos` | `codEquipamento` | — | `equipamento`, `grupoUser` (opcional), `soEq`, `socketEq`, `memoriaRam`, `tipoOffice`, `placaMae`, `bios`, `capacidadeRam`, `possuiSSD`, `possuiHD`, `capacidadeArmz`, `usoArmz` — ficha técnica da máquina daquela OS |
| `Procedimentos` | `codProcedimento` | — | `procedimento` VarChar(150) — catálogo de checagens padrão |
| `ProcedimentosOdS` | (`numOdS`, `codProcedimento`) | → `OrdemDeServicos`, → `Procedimentos` | associativa N:N — `posicao` VarChar(8), `checagem` VarChar(8), `obsProcedimento` VarChar(244) opcional, `dthFim` — checklist respondido por OS |
| `OrdemDeServicos` | `numOdS` UUID (UID gerado, `DEFAULT gen_random_uuid()`) | `codCliente` → `Clientes`, `codAparelho` → `Aparelhos`, `codEquipamento` → `Equipamentos` | `atendente`, `solicitante`, `defeito` obrigatórios; `dtAtendimento`, `obsTecnica`, `historicoManutencao`, `entreguePara`, `dtExecucao`, `acessorio`, `obsBalcao` opcionais; `tipoOdS` (classificação livre, ex.: "Garantia"); `situacao` VarChar(24) (máquina de estados — Lote OS-B, `DEFAULT 'Aberta'`, domínio fechado só em Zod, sem tabela de apoio) |
| `Cargos` | `codCargo` | — | `cargo` VarChar(15) — Lote OS-B |
| `Funcionarios` | `codFuncionario` | `codCidade` → `Cidades`, `codCargo` → `Cargos` | `funcionario`, `funcFone` — Lote OS-B |
| `Servicos` | `codServico` | `codFuncionario` → `Funcionarios` | `servico`, `valor` — catálogo de serviços, Lote OS-B |
| `Pecas` | `codPeca` | — | `peca` — catálogo simplificado de peças da OS, Lote OS-B |
| `ServicosOdS` | (`codServico`, `numOdS`) | → `Servicos`, → `OrdemDeServicos` | associativa N:N — `qtdServico`, Lote OS-B |
| `OrcamentoPecasOdS` | (`codPeca`, `numOdS`) | → `Pecas`, → `OrdemDeServicos` | associativa N:N — `vlrPv`, `aprovado` (aprovação por item; reprovar = soft delete da linha), Lote OS-B |
| `SubstituirPecasOdS` | (`codPeca`, `numOdS`) | → `Pecas`, → `OrdemDeServicos` | associativa N:N — `qtdPeca`, `vlrUnitarioPeca` (lançamento manual do técnico, só para peça orçada aprovada), Lote OS-B |

### Compras
| Tabela | PK | FKs | Campos notáveis |
|--------|----|-----|-----------------|
| `Compras` | (`numero`, `modelo`, `serie`) | `codForn` → `Fornecedores`, `codTransp` → `Transportadoras`, `codCondDePag` → `CondicaoDePagamento` (obrigatória), `codClassificacaoCompra` → `ClassificacoesCompra` (obrigatória) | `numero` VarChar(28), `modelo` VarChar(2), `serie` VarChar(2), `dtChegada`/`dtEmissao`/`dtEntrada` (datas da operação — `dtChegada` ≥ `dtEmissao` e ≤ data atual), `frete`, `seguro`, `despesas`, `vlrTotal` (valor final recalculado a partir do subtotal das parcelas, encargos da condição de pagamento, produtos vinculados e `frete`/`seguro`/`despesas`), `justificativaCancelamento` VarChar(255) |
| `ClassificacoesCompra` | `codClassificacaoCompra` | — | `classificacaoCompra` VarChar(12) unique (`obra-prima`\|`revenda`\|`serviços`) — domínio fechado semeado, sustenta a RN005; uma compra tem exatamente uma classificação, por isso é FK 1:N e não associativa |
| `CompraProduto` | (`numero`, `modelo`, `serie`, `codProduto`) | → `Compras` (composta), → `Produtos` | `custoMedioProduto` — dado histórico (custo no momento da compra); `percentualRateio` Decimal(5,2), `valorRateio` Decimal — rateio dos custos adicionais (`frete`/`seguro`/`despesas`) por item |

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
| Produto ↔ Categoria | `ProdutoCategoria` | ✓ — produto tem ao menos uma categoria; lista gerenciada embutida no formulário de produto |
| Compra ↔ Produto | `CompraProduto` | ✓ (FK composta `numero`/`modelo`/`serie`) + `custoMedioProduto` (histórico) + `percentualRateio`/`valorRateio` (rateio de custos adicionais) |
| NF-e ↔ Produto | `ProdutoNfe` | ✓ + campos tributários por item |
| NF-e ↔ Veículo | `VeiculoNfe` | ✓ |

## Scripts de seed

`/Backend/src/db/seed.ts` popula o banco de forma **idempotente** (`INSERT ... ON CONFLICT
DO NOTHING/UPDATE`), respeitando a ordem de dependências:

```
Paises → Estados → Cidades
Categorias → Produtos → ProdutoCategoria (vínculo produto × categoria)
ClassificacoesCompra (domínio fechado — obra-prima, revenda, serviços)
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
