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
- `codUser` — usuário responsável pela operação (auditoria; FK formal ativada em EP-10).
- `isActive` — flag de soft-delete / ativação.

> **Grafias corrigidas na implementação:** o diagrama original continha erros tipográficos
> (`Forncedores`, `tenha`, `adicionarProsutoNfe`, `cfoPfodNfe`, `codUSer`).
> Todos foram corrigidos nos nomes de código — este documento já usa as formas corretas.

---

## 1. Localização (Geografia)

Hierarquia geográfica reutilizada por parceiros e veículos. Cadastros mais básicos do
sistema — primeiros candidatos do [Roadmap](09-roadmap.md).

### Paises
- **Atributos:** `codPais`, `pais`, `sigla`, `ddi`, `moeda`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarPaises()`, `adicionarPaises()`, `editarPaises()`, `removerPaises()`

### Estados
- **Atributos:** `codEstado`, `codPais`, `uf`, `estado`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** pertence a um **País**.
- **Operações:** `consultarEstados()`, `adicionarEstados()`, `editarEstado()`, `removerEstados()`, `consultarPaises()`

### Cidades
- **Atributos:** `codCidade`, `codEstado`, `cidade`, `ddd`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** pertence a um **Estado**.
- **Operações:** `consultarCidades()`, `adicionarCidade()`, `editarCidade()`, `removerCidade()`, `consultarEstados()`

---

## 2. Parceiros de negócio

Pessoas/empresas com quem a empresa transaciona. Todos referenciam **Cidade**
(ver [Localização](#1-localização-geografia)).

> Campos homônimos entre entidades (endereço, bairro, CEP, fone, CPF/CNPJ) recebem
> **sufixo de contexto** (`Forn`, `Cl`, `Transp`) para evitar ambiguidade em JOINs.
> Todos armazenados sem máscara — dígitos puros (ver [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem)).

### Fornecedores
- **Atributos:** `codForn`, `codCidade`, `fornecedor`, `nomeFantasia`, `enderecoForn`, `bairroForn`, `cepForn`, `foneForn`, `cpfCnpjForn`, `inscEstSubTrib`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarFornecedores()`, `adicionarFornecedor()`, `editarFornecedor()`, `removerFornecedor()`, `listarProdutosFornecedor()`, `listarContasPagarFornecedor()`
- **Liga-se a:** [Produtos](#3-produtos-e-catálogo) (via [ProdutoFornecedor](#produtofornecedor)), [Contas a Pagar](#contasapagar), [Compras](#6-compras), [NF-e](#7-fiscal-nf-e).

### Clientes
- **Atributos:** `codCliente`, `codCidade`, `codCondDePag`, `cliente`, `enderecoCl`, `bairroCl`, `cepCl`, `foneCl`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** referencia **Cidade** (`codCidade`) e **Condição de Pagamento** (`codCondDePag`).
- **Operações:** `consultarClientes()`, `adicionarCliente()`, `editarCliente()`, `removerCliente()`
- **Liga-se a:** [Contas a Receber](#contasareceber), [NF-e](#7-fiscal-nf-e).

### Transportadoras
- **Atributos:** `codTransp`, `codCidade`, `codVeiculo`, `transportadora`, `nomeFantasia`, `tipoPessoa`, `enderecoTransp`, `cpfCnpjTransp`, `inscEstTransp`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarTransportadoras()`, `adicionarTransportadora()`, `editarTransportadora()`, `removerTransportadora()`, `consultarVeiculos()`
- **Liga-se a:** [Veículos](#4-logística-e-veículos), [NF-e](#7-fiscal-nf-e).

---

## 3. Produtos e Catálogo

Núcleo de mercadorias da empresa (equipamentos, periféricos, acessórios e correlatos), com categorias. A classificação fiscal (NCM/SH) foi
removida do escopo do MVP — ver [Modelo de Dados](06-modelo-de-dados.md#princípios-de-modelagem).

### Produtos
- **Atributos:** `codProd`, `produto`, `undProduto`, `estoque`, `pesoBruto`, `pesoLiq`, `saldoProd`, `custoMedioProd`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarProdutos()`, `adicionarProduto()`, `editarProduto()`, `removerProduto()`, `consultarFornecedores()`, `consultarCategorias()`
- **Imutáveis na edição:** `estoque` e `custoMedioProd` são definidos no cadastro (custo inicial); após a criação só são alterados por **compras** (movimentação de estoque / custo médio ponderado) — nunca por edição direta.
- O produto **não carrega código de categoria**: a relação com Categorias é **N:N** e vive
  na associativa `ProdutoCategoria`. Um produto tem **ao menos uma** categoria; a lista é
  gerenciada de forma embutida e atômica dentro do formulário de produto (mesmo padrão de
  Condição de Pagamento × Parcelas).

### Categorias
- **Atributos:** `codCategoria`, `categoria`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarCategorias()`, `adicionarCategoria()`, `editarCategoria()`, `removerCategoria()`
- Taxonomia **aberta**, mantida pelo usuário. Não se confunde com
  [ClassificacoesCompra](#6-compras), que é um domínio fechado de propósito de compra.

### ProdutoCategoria *(associativa Produto × Categoria — FK puras)*
- **Atributos:** `codProduto`, `codCategoria`
- **Operações:** `consultarProdutoCategorias()`, `adicionarProdutoCategoria()`, `removerProdutoCategoria()`
- Sem colunas de auditoria nem `isActive`: o vínculo não tem ciclo de vida próprio e sua
  remoção é exclusão física — o histórico protegido pelo soft delete vive em `Produtos` e
  `Categorias`. A exclusão de uma categoria vinculada a produto ativo é bloqueada (RN002).

### ProdutoFornecedor *(associativa Produto × Fornecedor — FK puras)*
- **Atributos:** `codProd`, `codForn`, `dtCriacao`, `dtEdicao`, `codUser`
- **Operações:** `inserirProdutoFornecedor()`, `editarProdutoFornecedor()`, `removerProdutoFornecedor()`, `listarProdutosFornecedor()`

---

## 4. Logística e Veículos

### Veiculos
- **Atributos:** `codVeiculo`, `codEstado`, `modeloVeiculo`, `marca`, `placaVeiculo`, `placaMercoSul`, `codAntt`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarVeiculos()`, `adicionarVeiculo()`, `editarVeiculo()`, `removerVeiculo()`, `consultarEstados()`
- **Liga-se a:** [Transportadoras](#transportadoras), [NF-e](#7-fiscal-nf-e) (via [VeiculoNfe](#veiculonfe)).

### VeiculoNfe *(associativa Veículo × NF-e — FK puras)*
- **Atributos:** `codNfe`, `codVeiculo`, `codForn`
- **Operações:** `vincularVeiculoNfe()`, `desvincularVeiculoNfe()`

---

## 5. Financeiro

Condições/formas de pagamento, parcelamento e contas. Estrutura compartilhada entre
[Compras](#6-compras) (a pagar) e vendas (a receber).

### CondicaoDePagamento
- **Atributos:** `codCondDePag`, `descricao`, `juroCondPag`, `multaCondPag`, `descontoCondPag`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarCondicaoPagamento()`, `adicionarCondicaoPagamento()`, `editarCondicaoPagamento()`, `consultarParcelas()`, `removerCondicaoPagamento()`
- **Invariantes do plano de parcelamento** (validadas no backend, Zod):
  - Toda condição deve ter **≥ 1 parcela** (RN003).
  - Os `numDias` das parcelas devem ser **estritamente crescentes** — sem dias repetidos (RN004).
  - **À vista = 1 dia** — `numDias` mínimo é 1; 0 não é permitido (RN005).
  - A soma dos `percentual` de todas as parcelas deve ser exatamente **100%** (RN006).

### FormaDePagamento
- **Atributos:** `codFormaDePag`, `formaDePag`, `prazoCompensacao`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarFormasDePagamento()`, `adicionarFormasDePagamento()`, `removerFormasDePagamento()`, `editarFormasDePagamento()`

### Parcelas
- **Atributos:** `codParcela`, `codCondDePag`, `codFormaDePag`, `percentual`, `numDias`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Relacionamento:** liga **Condição** e **Forma** de pagamento; gerenciadas **dentro** do formulário de condição (persistência atômica via `WithTransaction`).
- **Operações:** `consultarParcelas()`, `adicionarParcelas()`, `removerParcelas()`, `editarParcelas()`

### ContasAPagar
- **Atributos:** `numero`, `modelo`, `serie`, `parcela`, `codFornecedor`, `codFormaDePag`, `dtEmissao`, `dtVencimento`, `valor`, `juro`, `desconto`, `multa`, `valorBaixa`, `dtBaixa`, `justificativaCancelamento`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- `numero` (VarChar(28)), `modelo` (VarChar(2)), `serie` (VarChar(2)) e `parcela` (Int) formam
  a **chave primária composta** — chave natural do documento de compra parcelado, substituindo
  o antigo identificador substituto `codContasAPag`; mesmo tratamento aplicado a
  [ContasAReceber](#contasareceber) e [Compras](#compras).
- Conta a pagar **não referencia mais NF-e diretamente** (`codNfe` removido) — o vínculo com
  a nota fiscal deixa de ser uma FK formal em `ContasAPagar`.
- Conta a pagar **não referencia mais `Parcelas`** (`codParcela` removido) — `parcela` passa a
  ser o número da parcela do próprio documento, parte da chave natural, e não mais uma FK para
  a parcela da condição de pagamento; em seu lugar, `ContasAPagar` passa a referenciar
  **Forma de Pagamento** (`codFormaDePag`), espelhando `ContasAReceber`.
- `dtVencimento` e `valor` são a nomenclatura unificada dos antigos `vencFatura`/`vlrFatura`
  — mesmo nome usado em `ContasAReceber`.
- `juro`, `desconto` e `multa` são os encargos apurados no título. `valorBaixa` e `dtBaixa`
  registram o valor e a data em que o título foi efetivamente quitado — anuláveis, só
  preenchidos por `registrarContaPaga()`, nunca no cadastro. `justificativaCancelamento`
  é preenchida por `cancelarContaPagar()` (mesma dinâmica de `Compras`/`ContasAReceber`).
- **Cancelamento só antes da baixa:** `cancelarContaPagar()` só é permitido enquanto
  `valorBaixa`/`dtBaixa` ainda estiverem nulos (título não pago); exige também
  **reautenticação** do usuário (RN003 transversal, ver
  [Segurança](08-seguranca-e-autenticacao.md#reautenticação-para-cancelamento-rn003)).
- **Operações:** `consultarContasPagar()`, `adicionarContaPagar()`, `editarContaPagar()`, `removerContaPagar()`, `registrarContaPaga()`, `cancelarContaPagar()`

### ContasAReceber
- **Atributos:** `numero`, `modelo`, `serie`, `parcela`, `codCliente`, `codFormaDePag`, `dtEmissao`, `dtVencimento`, `dtPagamento`, `valor`, `juro`, `desconto`, `multa`, `valorBaixa`, `dtBaixa`, `justificativaCancelamento`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- `numero` (VarChar(28)), `modelo` (VarChar(2)), `serie` (VarChar(2)) e `parcela` (Int) formam
  a **chave primária composta** — chave natural do documento de venda parcelado, substituindo
  o antigo identificador substituto `codContasARec`; mesmo tratamento aplicado a
  [Compras](#compras).
- Conta a receber **não referencia mais NF-e diretamente** (`codNfe` removido) — o vínculo com
  a nota fiscal deixa de ser uma FK formal em `ContasAReceber`.
- `dtVencimento` e `valor` são a nomenclatura unificada dos antigos `vencRecibo`/`vlrRecibo`
  — mesmo nome usado em `ContasAPagar`.
- `juro`, `desconto` e `multa` são os encargos apurados no título. `valorBaixa` e `dtBaixa`
  registram o valor e a data em que o título foi efetivamente quitado — anuláveis, assim como
  `dtPagamento`, só preenchidos por `registrarPagamentoRecebido()`, nunca no cadastro.
  `justificativaCancelamento` é preenchida por `cancelarContaReceber()` (mesma dinâmica de
  `Compras`/`ContasAPagar`).
- **Cancelamento só antes da baixa:** `cancelarContaReceber()` só é permitido enquanto
  `valorBaixa`/`dtBaixa`/`dtPagamento` ainda estiverem nulos (título não recebido);
  exige também **reautenticação** do usuário (RN003 transversal, ver
  [Segurança](08-seguranca-e-autenticacao.md#reautenticação-para-cancelamento-rn003)).
- **Operações:** `consultarContasReceber()`, `adicionarContaReceber()`, `editarContaReceber()`, `removerContaReceber()`, `registrarPagamentoRecebido()`, `cancelarContaReceber()`

---

## 6. Compras

Registro de compras a fornecedores e os itens comprados. Operação transacional crítica
(ver [RNF06](04-requisitos.md#requisitos-não-funcionais)).

### Compras
- **Atributos:** `numero`, `modelo`, `serie`, `codForn`, `codTransp`, `codCondDePag`, `codClassificacaoCompra`, `dtChegada`, `dtEmissao`, `dtEntrada`, `frete`, `seguro`, `despesas`, `vlrTotal`, `justificativaCancelamento`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- `numero` (VarChar(28)), `modelo` (VarChar(2)) e `serie` (VarChar(2)) formam a **chave
  primária composta** — chave natural do documento de compra, substituindo o antigo
  identificador substituto `codCompra`.
- `codClassificacaoCompra` — FK obrigatória para `ClassificacoesCompra`, que define o
  propósito da compra: **obra-prima**, **revenda** ou **serviços**. Uma compra tem
  **exatamente uma** classificação (RN005) — por isso é FK 1:N, não associativa; não se
  mistura produtos de propósitos diferentes numa mesma compra/nota fiscal.
- `dtChegada`, `dtEmissao` e `dtEntrada` — datas de chegada da mercadoria, emissão do
  documento de compra e da operação de entrada (registro no estoque), respectivamente.
- **Invariante de datas (RN004):** `dtChegada` não pode ser **anterior** a `dtEmissao`
  (pode ser igual ou posterior) e deve estar **entre `dtEmissao` e a data atual**
  (sem data de chegada futura).
- `frete`, `seguro` e `despesas` — custos adicionais da operação de compra, somados ao
  custo dos produtos para compor o custo médio ponderado no recebimento. No formulário,
  são apresentados **antes** da tabela de produtos, pois são a base do rateio de custo
  de cada item (RN009); o total geral da compra é sempre apresentado **depois** dos
  subtotais que o compõem — condição de pagamento, subtotal dos produtos, despesas etc.
  (RN010).
- `vlrTotal` — valor final da compra, recalculado sempre que qualquer fator do cálculo
  muda: o subtotal das parcelas da condição de pagamento (`CondicaoDePagamento`/
  `Parcelas`), os encargos da própria condição (`juroCondPag`/`multaCondPag`/
  `descontoCondPag`), as características dos produtos vinculados (`CompraProduto` —
  quantidade e `custoMedioProduto` de cada item) e `frete`/`seguro`/`despesas`. É o
  campo exibido como total geral da compra (RN010, acima).
- `justificativaCancelamento` — preenchida por `cancelarCompra()`, registra o motivo do
  cancelamento da compra; `cancelarCompra()` exige **reautenticação** do usuário
  (RN003 transversal, ver [Segurança](08-seguranca-e-autenticacao.md#reautenticação-para-cancelamento-rn003)).
- `codCondDePag` é **obrigatório** (`NOT NULL`) — toda compra precisa ter uma condição
  de pagamento definida. **Herança do fornecedor (RN006):** ao selecionar o fornecedor,
  `codCondDePag` é pré-preenchido com a condição cadastrada nele; o usuário pode
  **alterá-la apenas para aquela compra** — a alteração não é gravada de volta no
  cadastro do fornecedor.
- **Validação prévia do documento (RN007):** numa compra nova, `numero`/`modelo`/`serie`
  devem ser validados (formato e inexistência prévia no banco, via
  `validarDocumentoCompra()`) antes de liberar os demais campos do formulário.
- **Exclusão consultável (RN008):** excluir uma compra abre o formulário em modo de
  **consulta** antes de confirmar a remoção da lista.
- Compra **não referencia mais NF-e diretamente** (`codNfe` removido) — o vínculo com a
  nota fiscal, quando existir, deixa de ser uma FK formal em `Compras`.
- **Operações:** `consultarCompras()`, `validarDocumentoCompra()`, `adicionarCompra()`, `cancelarCompra()`, `consultarNotaFiscal()`, `consultarCondicoesPagamento()`, `consultarProdutos()`, `consultarFornecedores()`, `consultarClientes()`, `consultarTransportadoras()`, `realizarCompra()`, `gerarNotaFiscal()`
- **Liga-se a:** [Fornecedores](#fornecedores), [Transportadoras](#transportadoras), [Condição de Pagamento](#condicaodepagamento), ClassificacoesCompra.

### ClassificacoesCompra *(domínio fechado do propósito da compra)*
- **Atributos:** `codClassificacaoCompra`, `classificacaoCompra`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarClassificacoesCompra()`
- Os três valores — **obra-prima**, **revenda** e **serviços** — são semeados pelo script
  de seed e sustentam a RN005. Não são uma "categoria": diferente de
  [Categorias](#3-produtos-e-catálogo), que é taxonomia aberta do catálogo de produtos,
  este é um domínio fechado do qual depende regra de negócio — renomear ou desativar um
  valor aqui muda o significado de compras já registradas.

### CompraProduto *(associativa Compra × Produto)*
- **Atributos:** `numero`, `modelo`, `serie`, `codProduto`, `custoMedioProduto`, `percentualRateio`, `valorRateio`, `dtCriacao`, `dtEdicao`, `codUser`
- `numero`, `modelo`, `serie` — chave estrangeira composta para [Compras](#compras) (substitui `codCompra`).
- `custoMedioProduto` — dado histórico: custo unitário no momento da compra (pode divergir do custo médio atual).
- `percentualRateio` e `valorRateio` — rateio dos custos adicionais da compra
  (`frete`/`seguro`/`despesas`) aplicado ao item, exibido na tabela de produtos tanto em
  **percentual** quanto em **valor** (RN011).
- **Operações:** `consultarCompraProdutos()`, `adicionarCompraProduto()`, `editarCompraProduto()`, `removerCompraProduto()`

---

## 7. Fiscal (NF-e)

Modelagem da **Nota Fiscal Eletrônica** com campos tributários brasileiros. Termos
fiscais explicados no [Glossário](10-glossario.md). Suporte à emissão é
[RNF10](04-requisitos.md#requisitos-não-funcionais).

### NotasFiscaisEletronicas
- **Atributos (identificação/transporte):** `codNfe`, `modelo`, `numSerie`, `codFornecedor`, `codTransportadora`, `codProduto`, `codVeiculo`, `dtReciboNfe`, `dhEmiNfe`, `dhSaiNfe`, `naturezaOp`, `inscEstadualNfe`, `cpfCnpjNfe`, `infoCompl`, `chaveAcessoNfe`, `fretePorConta`, `dtAcessoProduto`
- `dhEmiNfe` e `dhSaiNfe` — DateTime (data + hora unificados); substituem os campos separados `dtEmissaoNfe`/`hrEmissaoNfe`/`dtSaidaNfe`/`hrSaidaNfe` do diagrama original.
- `chaveAcessoNfe` — Char(44), sempre exatamente 44 dígitos (chave de acesso NF-e).
- **Atributos (tributários):** `csosnProdNfe`, `cfopNfe` *(CFOP)*, `qtdProdNfe`, `vlrUnProdNfe`, `vlrDescProdNfe`, `vlrProdNfe`, `vlrIpiProdNfe`, `aliqIcmsProdNfe`, `aliqIpiProdNfe`, `baseIcmsProdNfe`, `calcIcmsSubs`, `vlrIcmsSubs`
- **Atributos (controle):** `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- **Operações:** `consultarNotaFiscal()`, `adicionarNotaFiscal()`, `editarNotaFiscal()`, `cancelarNotaFiscal()`, `solicitarNotaFiscal()`, `confirmarEntregaProduto()`

### ProdutoNfe *(itens da NF-e — associativa Produto × NF-e)*
- **Atributos:** `codNfe`, `codProduto`, `prodBcIcms`, `prodCfopNfe`, `prodCsosnNfe`, `prodVlrUnNfe`, `prodQtdNfe`, `prodVlrDescNfe`, `prodVlrIcmsNfe`, `prodVlrIpiNfe`, `prodAliqIcmsNfe`, `prodAliqIpiNfe`, `dtCriacao`, `dtEdicao`, `codUser`
- **Operações:** `adicionarProdutoNfe()`, `removerProdutoNfe()`, `listarProdutosNfe()`

### VeiculoNfe
Documentada em [Logística e Veículos](#veiculonfe) — vincula o veículo de transporte à nota.

---

## 8. Atendimento (Ordem de Serviço)

Módulo central da Kaneko Informática (RF16) — recebimento, diagnóstico, execução e
entrega de equipamentos. Ver [Roadmap](09-roadmap.md#fase-os--ordem-de-serviço-⭐-módulo-central-da-kaneko-informática)
para a ordem de implementação (lotes OS-A/OS-B/OS-C).

> **Nota de revisão (Lote OS-A):** o esquema desta seção foi implementado no banco
> (migration `add-ordem-de-servico-tables`) **antes** desta revisão da documentação, com
> um desenho diferente do que constava aqui originalmente (chave substituta `codOS`,
> `status` como máquina de estados, `valorTotal`, `condicaoDePagamento`, peças via
> `Produtos`). Por decisão do responsável pelo projeto, **a migration já aplicada é a
> fonte de verdade** — esta seção foi reescrita para refletir o schema real; o desenho
> anterior foi descartado. A única correção feita sobre a migration original (por
> decisão do responsável pelo projeto) foi mover `posicao`/`checagem`/`obsProcedimento`/
> `dthFim` de `Procedimentos` para a nova tabela associativa
> [ProcedimentosOdS](#procedimentosods-checklist-de-checagens---associativa-os--procedimento),
> pois um único `codProcedimento` no cabeçalho da OS não comporta a checklist de
> múltiplas checagens por atendimento (ver migration
> `ajustar-procedimentos-checklist-ods`).

### Aparelhos *(unidade física recebida do cliente)*
- **Atributos:** `codAparelho`, `aparelho`, `serie`, `modelo`, `voltagem`, `garantia`,
  `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- `aparelho` (tipo/nome do aparelho, ex.: "Notebook") e `serie` (número de série) são
  opcionais — nem toda unidade tem série visível; `modelo`, `voltagem` e `garantia`
  (texto livre, ex.: "12 meses", "fora de garantia") são obrigatórios e próprios daquela
  unidade específica (não de um catálogo — duas unidades do mesmo modelo têm garantias
  diferentes).
- **Não é cadastro de apoio pré-existente:** nasce junto com a Ordem de Serviço, na
  mesma transação de `abrirOS()` (RNF06) — não há tela nem rota própria de cadastro.
- **Liga-se a:** [OrdemDeServico](#ordemdeservico) (1:1, referenciado por `codAparelho`).

### Equipamentos *(ficha técnica de hardware/software da máquina)*
- **Atributos:** `codEquipamento`, `equipamento`, `grupoUser`, `soEq`, `socketEq`,
  `memoriaRam`, `tipoOffice`, `placaMae`, `bios`, `capacidadeRam`, `possuiSSD`,
  `possuiHD`, `capacidadeArmz`, `usoArmz`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- Ficha levantada para o computador **daquela OS específica** (specs reais da máquina
  recebida) — não é catálogo de configurações reaproveitável. `grupoUser` é o nome do
  grupo de usuários com acesso de rede àquele computador (por isso opcional — nem toda
  máquina está em rede); os demais campos técnicos são obrigatórios.
- **Não é cadastro de apoio pré-existente:** nasce junto com a Ordem de Serviço, na
  mesma transação de `abrirOS()` (RNF06), ao lado de [Aparelhos](#aparelhos-unidade-física-recebida-do-cliente).
- **Liga-se a:** [OrdemDeServico](#ordemdeservico) (1:1, referenciado por `codEquipamento`).

### Procedimentos *(catálogo de checagens padrão)*
- **Atributos:** `codProcedimento`, `procedimento`, `dtCriacao`, `dtEdicao`, `codUser`,
  `isActive`
- Cadastro de apoio simples (mesmo padrão de `Categorias`) — cada checagem padronizada
  (ex.: "Há lacres?", "Aparelho liga?") é cadastrada uma única vez e reutilizada em
  quantas OS forem necessárias; a resposta de cada checagem por atendimento vive em
  [ProcedimentosOdS](#procedimentosods-checklist-de-checagens---associativa-os--procedimento).
- **Operações:** `consultarProcedimentos()`, `adicionarProcedimento()`,
  `editarProcedimento()`, `removerProcedimento()`

### ProcedimentosOdS *(checklist de checagens — associativa OS × Procedimento)*
- **Atributos:** `numOdS`, `codProcedimento`, `posicao`, `checagem`, `obsProcedimento`,
  `dthFim`, `dtCriacao`, `dtEdicao`, `codUser`, `isActive`
- Chave composta (`numOdS`, `codProcedimento`) — no máximo uma resposta por checagem do
  catálogo em cada OS. `posicao` é a posição física da observação em relação ao
  equipamento (ex.: "Embaixo"); `checagem` é o resultado (ex.: "SIM"/"NÃO");
  `obsProcedimento` é opcional (detalhe da observação); `dthFim` é a data/hora em que
  aquela checagem foi finalizada.
- Gerenciada de forma embutida e atômica dentro do formulário de diagnóstico da OS (mesmo
  padrão de Condição de Pagamento × Parcelas), respondida via `registrarDiagnosticoOS()`,
  com reconciliação por diferença de conjuntos pela chave `codProcedimento` (mesmo padrão
  de Parcelas: item ausente da lista enviada é removido, item novo é criado).
- **Operações:** `adicionarProcedimentoOS()`, `editarProcedimentoOS()`,
  `removerProcedimentoOS()`, `consultarProcedimentosOS()`
- **Liga-se a:** [OrdemDeServico](#ordemdeservico), [Procedimentos](#procedimentos-catálogo-de-checagens-padrão).

### OrdemDeServico
- **Atributos:** `numOdS`, `codCliente`, `atendente`, `dtAtendimento`, `dtExecucao`,
  `codAparelho`, `acessorio`, `defeito`, `obsBalcao`, `obsTecnica`, `entreguePara`,
  `tipoOdS`, `codEquipamento`, `historicoManutencao`, `solicitante`, `dtCriacao`,
  `dtEdicao`, `codUser`, `isActive`
- `numOdS` — **chave primária natural** `CHAR(8)`, informada pelo requisitante na
  abertura (mesmo padrão de chave natural de `Compras`/`ContasAPagar`/`ContasAReceber`);
  o Postgres rejeita duplicidade (`23505` → 409 PT).
- **Relacionamento:** referencia **Cliente** (`codCliente`), **Aparelho**
  (`codAparelho`) e **Equipamento** (`codEquipamento`); agrega
  [ProcedimentosOdS](#procedimentosods-checklist-de-checagens---associativa-os--procedimento).
- `atendente` (quem abriu a OS) e `solicitante` (quem solicitou o serviço, pode diferir
  do cliente cadastrado) são texto livre; `acessorio`, `obsBalcao`, `entreguePara` e
  `historicoManutencao` são opcionais.
- **Abertura (`abrirOS()`):** cria o cabeçalho e, na mesma transação (RNF06), os
  registros de [Aparelhos](#aparelhos-unidade-física-recebida-do-cliente) e
  [Equipamentos](#equipamentos-ficha-técnica-de-hardwaresoftware-da-máquina) daquela
  unidade — os três nascem ou não nascem juntos. Preenche `codCliente`, `atendente`,
  `acessorio`, `defeito`, `obsBalcao`, `tipoOdS`, `solicitante`; `dtAtendimento`,
  `dtExecucao`, `obsTecnica` e `entreguePara` começam nulos.
- **Diagnóstico (`registrarDiagnosticoOS()`):** operação dedicada (não passa pelo
  `Update`) que define/atualiza `obsTecnica` e `historicoManutencao`, preenche
  `dtAtendimento` (data do primeiro diagnóstico, se ainda nula) e reconcilia a lista de
  [ProcedimentosOdS](#procedimentosods-checklist-de-checagens---associativa-os--procedimento)
  enviada.
- **Ainda fora do Lote OS-A** (ver [Roadmap](09-roadmap.md#fase-os--ordem-de-serviço-⭐-módulo-central-da-kaneko-informática)):
  não há `status` (máquina de estados), `valorTotal`, `condicaoDePagamento`,
  `garantiaDias`, execução de serviços/peças, aprovação do cliente, encerramento
  (geração de Conta a Receber), registro de entrega nem cancelamento formal — essas
  tabelas já existem no banco (ver abaixo) mas ainda sem camada de aplicação.
- **Operações do Lote OS-A:** `consultarOrdensServico()`, `abrirOS()`,
  `registrarDiagnosticoOS()`, `consultarClientes()`.
- **Liga-se a:** [Clientes](#clientes), [Aparelhos](#aparelhos-unidade-física-recebida-do-cliente),
  [Equipamentos](#equipamentos-ficha-técnica-de-hardwaresoftware-da-máquina),
  [Procedimentos](#procedimentos-catálogo-de-checagens-padrão) (via ProcedimentosOdS).

### Entidades do Lote OS-B (execução) — já no banco, sem camada de aplicação

Criadas pela mesma migration inicial da Fase OS; a documentação de operações/regras de
negócio destas entidades é adiada para o Lote OS-B, quando ganham service/controller/rotas:

- **Cargos** — `codCargo`, `cargo`, auditoria. Cadastro de apoio de cargos internos.
- **Funcionarios** — `codFuncionario`, `codCidade` → `Cidades`, `codCargo` → `Cargos`,
  `funcionario`, `funcFone`, auditoria. Substitui `Users` como referência de técnico
  responsável nas linhas de serviço (recursos humanos, não login).
- **Servicos** — `codServico`, `servico`, `valor`, `codFuncionario` → `Funcionarios`,
  auditoria. Catálogo de serviços com preço fixo.
- **Pecas** — `codPeca`, `peca`, auditoria. Catálogo de peças específico da OS
  (mais simples que `Produtos`, que continua sendo o catálogo de revenda).
- **ServicosOdS** *(associativa OS × Servico)* — `codServico`, `numOdS`, `qtdServico`,
  auditoria. Serviços efetivamente executados na OS.
- **OrcamentoPecasOdS** *(associativa OS × Peca)* — `codPeca`, `numOdS`, `vlrPv`,
  `aprovado`, auditoria. Orçamento de peças pendente de aprovação do cliente.
- **SubstituirPecasOdS** *(associativa OS × Peca)* — `codPeca`, `numOdS`, `qtdPeca`,
  `vlrUnitarioPeca`, auditoria. Peças efetivamente substituídas após aprovação.

---

## 9. Acesso e Usuários

### Users
- **Atributos:** `codUser`, `perfil`, `user`, `email`, `senha`, `dtCriacao`, `dtEdicao`, `isActive`
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
                    Financeiro ◀─┴──────── Atendimento (OS) ◀── Produtos (peças)
                         ▲                       ▲
                       Acesso (Users → auditoria em todas; técnico da OS)
```

## Documentos relacionados

- [Modelo de Dados](06-modelo-de-dados.md) — tabelas, PKs/FKs e normalização destas classes.
- [Casos de Uso](07-casos-de-uso.md) — regras de negócio que regem as operações.
- [Requisitos](04-requisitos.md) — RFs que estas entidades realizam.
- [Glossário](10-glossario.md) — significado dos campos fiscais.
