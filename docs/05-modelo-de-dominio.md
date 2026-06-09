# 05 — Modelo de Domínio

Transcrição do **Diagrama de Classes** (`Sistema de Compras - Diagrama de Classes.png`),
organizada por subdomínio. Cada classe lista seus **atributos** e suas **operações**
(métodos). As operações são o contrato de comportamento de cada entidade na camada de
domínio (ver [Arquitetura](02-arquitetura.md#camadas-sugeridas-do-backend-backendsrc)).

O mapeamento para tabelas, chaves e relacionamentos está em
[Modelo de Dados](06-modelo-de-dados.md). As regras de negócio que governam cada
operação estão em [Casos de Uso](07-casos-de-uso.md).

## Convenções de atributos comuns

Quase todas as entidades compartilham campos de **auditoria/controle** (ver
[Segurança](08-seguranca-e-autenticacao.md#auditoria)):

- `dtCriacao`, `dtEdicao` — timestamps de criação e última edição.
- `codUser` — usuário responsável pela operação (FK para [Users](#users)).
- `isActive` — flag de soft-delete / ativação.

> **Nota de grafia:** o diagrama traz inconsistências a normalizar na implementação —
> ex.: a classe `Forncedores` (falta o "e"), `tenha` em vez de `senha` em `Users`,
> `adicionarProsutoNfe`, `cfoPfodNfe` (CFOP), `codUSer`. A grafia oficial de
> referência aqui segue o diagrama; padronizar nomes é tarefa do
> [Roadmap](09-roadmap.md).

---

## 1. Localização (Geografia)

Hierarquia geográfica reutilizada por parceiros e veículos. Cadastros mais básicos do
sistema — primeiros candidatos do [Roadmap](09-roadmap.md).

### Paises
- **Atributos:** `codPais`, `pais`, `sigla`, `ddi`, `moeda`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarPaises()`, `adicionarPaises()`, `editarPaises()`, `removerPaises()`

### Estados
- **Atributos:** `codEstado`, `uf`, `estado`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** pertence a um **País**.
- **Operações:** `consultarEstados()`, `adicionarEstados()`, `editarEstado()`, `removerEstados()`, `consultarPaises()`

### Cidades
- **Atributos:** `codCidade`, `codEstado`, `cidade`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** pertence a um **Estado**.
- **Operações:** `consultarCidades()`, `adicionarCidade()`, `editarCidade()`, `removerCidade()`, `consultarEstados()`

---

## 2. Parceiros de negócio

Pessoas/empresas com quem o bazar transaciona. Todos referenciam **Cidade**
(ver [Localização](#1-localização-geografia)).

### Forncedores *(grafia do diagrama; ler "Fornecedores")*
- **Atributos:** `codForn`, `fornecedor`, `endereco`, `bairro`, `cep`, `codCidade`, `fone`, `cpfCnpj`, `inscEstSubTrib`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarFornecedores()`, `adicionarFornecedor()`, `editarFornecedor()`, `removerFornecedor()`, `listarProdutosFornecedor()`, `listarContasPagarFornecedor()`
- **Liga-se a:** [Produtos](#3-produtos-e-catálogo) (via [ProdutoFornecedor](#produtofornecedor)), [Contas a Pagar](#contasapagar), [Compras](#6-compras), [NF-e](#7-fiscal-nf-e).

### Clientes
- **Atributos:** `cl_id`, `cidade_id`, `cond_pag_id`, `cliente`, `endereco`, `bairro`, `cep`, `telefone`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** referencia **Cidade** (`cidade_id`) e **Condição de Pagamento** (`cond_pag_id`).
- **Operações:** `consultarClientes()`, `adicionarCliente()`, `editarCliente()`, `removerCliente()`
- **Liga-se a:** [Contas a Receber](#contasareceber), [NF-e](#7-fiscal-nf-e).

### Transportadoras
- **Atributos:** `codTransp`, `enderecoTransp`, `codCidade`, `transportadora`, `cpfCnpjTransp`, `inscEstTransp`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`, `codVeiculo`
- **Operações:** `consultarTransportadoras()`, `adicionarTransportadora()`, `editarTransportadora()`, `removerTransportadora()`, `consultarVeiculos()`
- **Liga-se a:** [Veículos](#4-logística-e-veículos), [NF-e](#7-fiscal-nf-e).

---

## 3. Produtos e Catálogo

Núcleo de mercadorias do bazar, com classificação fiscal (NCM/SH) e categorias.

### Produtos
- **Atributos:** `codProd`, `produto`, `undProduto`, `pesoBruto`, `pesoLiq`, `saldoProd`, `custoMedioProd`, `codNcmSH`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`, `codCategoria`
- **Operações:** `consultarProdutos()`, `adicionarProduto()`, `editarProduto()`, `removerProduto()`, `consultarFornecedores()`, `consultarNCM_SH()`, `consultarCategorias()`

### Categorias
- **Atributos:** `codCategoria`, `categoria`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarCategorias()`, `adicionarCategoria()`, `editarCategoria()`, `removerCategoria()`

### ProdutoCategoria *(associativa Produto × Categoria)*
- **Atributos:** `codCategoria`, `categoria`, `codProduto`, `produto`, `undProduto`, `saldoProduto`, `codNcmSh`
- **Operações:** `consultarProdutoCategorias()`, `adicionarPrdutoCategoria()`, `editarProdutoCategoria()`, `removerProdutoCategoria()`

### NCM_SH *(classificação fiscal de mercadoria — ver [Glossário](10-glossario.md))*
- **Atributos:** `codProd`, `codEstado`, `prodNcmSh`, `dtCriacao`, `dtEdicao`, `codUSer`, `isActive`
- **Operações:** `consultarNCM_SH()`, `adicionarNCM_SH()`, `editarNCM_SH()`, `removerNCM_SH()`

### ProdutoFornecedor *(associativa Produto × Fornecedor)*
- **Atributos:** `codProd`, `codForn`, `dtCriacao`, `dtEdicao`, `codUser`
- **Operações:** `inserirProdutoFornecedor()`, `editarProdutoFornecedor()`, `removerProdutoFornecedor()`, `listarProdutosFornecedor()`

---

## 4. Logística e Veículos

### Veiculos
- **Atributos:** `codVeiculo`, `codEstado`, `placaVeiculo`, `codAntt`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarVeiculos()`, `adicionarVeiculo()`, `editarVeiculo()`, `removerVeiculo()`, `consultarEstados()`
- **Liga-se a:** [Transportadoras](#transportadoras), [NF-e](#7-fiscal-nf-e) (via [VeiculoNfe](#veiculonfe)).

### VeiculoNfe *(associativa Veículo × NF-e)*
- **Atributos:** `codNfe`, `modelo`, `numSerie`, `codForn`, `codVeiculo`
- **Operações:** `vincularVeiculoNfe()`, `desvincularVeiculoNfe()`

---

## 5. Financeiro

Condições/formas de pagamento, parcelamento e contas. Estrutura compartilhada entre
[Compras](#6-compras) (a pagar) e vendas (a receber).

### CondicaoDePagamento
- **Atributos:** `codCondDePag`, `juroCondPag`, `multaCondPag`, `descontoCondPag`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarCondicaoPagamento()`, `adicionarCondicaoPagamento()`, `editarCondicaoPagamento()`, `consultarParcelas()`, `removerCondicaoPagamento()`

### FormaDePagamento
- **Atributos:** `codFormaDePag`, `formaDePag`, `prazoCompensacao`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarFormasDePagamento()`, `adicionarFormasDePagamento()`, `removerFormasDePagamento()`, `editarFormasDePagamento()`

### Parcelas
- **Atributos:** `codParcela`, `codCondDePag`, `codFormaDePag`, `percentual`, `numDias`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** liga **Condição** e **Forma** de pagamento.
- **Operações:** `consultarParcelas()`, `adicionarParcelas()`, `removerParcelas()`, `editarParcelas()`

### ContasAPagar
- **Atributos:** `codContasAPag`, `codNfe`, `numSerie`, `modelo`, `codFornecedor`, `codParcela`, `vencFatura`, `vlrFatura`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarContasPagar()`, `adicionarContaPagar()`, `editarContaPagar()`, `removerContaPagar()`, `consultarParcelas()`, `registrarContaPaga()`

### ContasAReceber
- **Atributos:** `codContasARec`, `codNfe`, `numSerie`, `modelo`, `codCliente`, `codFormaDePag`, `dtEmissao`, `vencRecibo`, `dtPagamento`, `vlrRecibo`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarContasReceber()`, `adicionarContaReceber()`, `editarContaReceber()`, `removerContaReceber()`, `registrarPagamentoRecebido()`

---

## 6. Compras

Registro de compras a fornecedores e os itens comprados. Operação transacional crítica
(ver [RNF06](04-requisitos.md#requisitos-não-funcionais)).

### Compras
- **Atributos:** `codCompra`, `codNfe`, `modelo`, `numSerie`, `codForn`, `codTransp`, `codCondDePag`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarCompras()`, `adicionarCompra()`, `cancelarCompra()`, `consultarNotaFiscal()`, `consultarCondicoesPagamento()`, `consultarProdutos()`, `consultarFornecedores()`, `consultarClientes()`, `consultarTransportadoras()`, `realizarCompra()`, `gerarNotaFiscal()`
- **Liga-se a:** [Fornecedores](#forncedores-grafia-do-diagrama-ler-fornecedores), [Transportadoras](#transportadoras), [Condição de Pagamento](#condicaodepagamento), [NF-e](#7-fiscal-nf-e).

### CompraProduto *(associativa Compra × Produto)*
- **Atributos:** `codCompra`, `codNfe`, `modelo`, `numSerie`, `codProduto`, `produto`, `undProduto`, `custoMedioProduto`, `codNcmSH`, `dtCriacao`, `dtEdicao`, `codUser`
- **Operações:** `consultarCompraProdutos()`, `adicionarCompraProduto()`, `editarCompraProduto()`, `removerCompraProduto()`

---

## 7. Fiscal (NF-e)

Modelagem da **Nota Fiscal Eletrônica** com campos tributários brasileiros. Termos
fiscais explicados no [Glossário](10-glossario.md). Suporte à emissão é
[RNF10](04-requisitos.md#requisitos-não-funcionais).

### NotasFiscaisEletronicas
- **Atributos (identificação/transporte):** `codNfe`, `modelo`, `numSerie`, `codFornecedor`, `codTransportadora`, `codProduto`, `codVeiculo`, `dtReciboNfe`, `dtEmissaoNfe`, `dtSaidaNfe`, `hrEmissaoNfe`, `hrSaidaNfe`, `naturezaOp`, `inscEstadualNfe`, `cpfCnpjNfe`, `infoCompl`, `chaveAcessoNfe`, `fretePorConta`, `dtAcessoProduto`
- **Atributos (tributários):** `csosnProdNfe`, `cfoPfodNfe` *(CFOP)*, `qtdProdNfe`, `vlrUnProdNfe`, `vlrDescProdNfe`, `vlrProdNfe`, `vlrIpiProdNfe`, `aliqIcmsProdNfe`, `aliqIpiProdNfe`, `baseIcmsProdNfe`, `calcIcmsSubs`, `vlrIcmsSubs`
- **Atributos (controle):** `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarNotaFiscal()`, `adicionarNotaFiscal()`, `editarNotaFiscal()`, `cancelarNotaFiscal()`, `solicitarNotaFiscal()`, `confirmarEntregaProduto()`

### ProdutoNfe *(itens da NF-e — associativa Produto × NF-e)*
- **Atributos:** `codNfe`, `modelo`, `numSerie`, `codProduto`, `prodBcIcms`, `prodCfopNfe`, `prodCsosnNfe`, `prodVlrUnNfe`, `prodQtdNfe`, `prodVlrDescNfe`, `prodVlrIcmsNfe`, `prodVlrIpiNfe`, `prodAliqIcmsNfe`, `prodAliqIpiNfe`, `dtCriacao`, `dtEdicao`, `codUser`
- **Operações:** `adicionarProsutoNfe()`, `removerProdutoNfe()`, `listarProdutosNfe()`

### VeiculoNfe
Documentada em [Logística e Veículos](#veiculonfe) — vincula o veículo de transporte à nota.

---

## 8. Acesso e Usuários

### Users
- **Atributos:** `codUser`, `perfil`, `user`, `email`, `tenha` *(grafia do diagrama; ler "senha")*, `dtCriacao`, `dtEdicao`, `isActive`
- **Operações:** `entrarConta()`, `sairConta()`, `registrarConta()`, `editarConta()`, `mudarSenha()`, `excluirConta()`
- **Papel central:** `codUser` aparece como referência de auditoria em quase toda
  entidade. Perfis e permissões em [Segurança e Autenticação](08-seguranca-e-autenticacao.md).

---

## Mapa de subdomínios

```
Localização ──< Parceiros ──< Compras >── Produtos
     │              │            │            │
     └──< Veículos  │            ▼            │
            │       │          NF-e ◀─────────┘
            └───────┴──────────▶ │
                    Financeiro ◀─┘
                         ▲
                       Acesso (Users → auditoria em todas)
```

## Documentos relacionados

- [Modelo de Dados](06-modelo-de-dados.md) — tabelas, PKs/FKs e normalização destas classes.
- [Casos de Uso](07-casos-de-uso.md) — regras de negócio que regem as operações.
- [Requisitos](04-requisitos.md) — RFs que estas entidades realizam.
- [Glossário](10-glossario.md) — significado dos campos fiscais.
