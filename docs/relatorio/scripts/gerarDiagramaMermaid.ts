import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Gera o Diagrama de Classes do sistema em sintaxe Mermaid (`classDiagram`), a partir de uma
// única fonte de dados estruturada (ENTIDADES / RELACIONAMENTOS) para que o diagrama nunca
// fique dessincronizado do que foi decidido em código/documentação.
//
// Fontes usadas para classificar cada entidade (campo `origem`):
//   - 'implementado'  → lido do schema real (Backend/src/db/types, gerado pelo kanel) e dos
//                       módulos em Backend/src/modules.
//   - 'documentado'   → modelado em docs/05-modelo-de-dominio.md e docs/06-modelo-de-dados.md,
//                       mas ainda sem backend/frontend (ver docs/09-roadmap.md).
//   - 'inferido'      → não modelado em docs/05 (só citado em docs/09-roadmap.md como bullet
//                       points, sem atributos); estrutura inferida a partir do relatório de
//                       exemplo "Eletrônica Flay Back" (modelo documentação pratica.pdf,
//                       seções 5.8 Equipamento, 5.15 Ordem de Serviço, 5.17 Problema relatado,
//                       5.19 Serviços, 5.21 Vendas).
//   - 'descartado'    → constava no diagrama original (Visual Paradigm) mas foi simplificado
//                       ou removido do escopo (ver docs/06-modelo-de-dados.md).

type StatusEntidade = 'implementado' | 'documentado' | 'inferido' | 'descartado';

interface CampoEntidade
{
  nome: string;
  tipo: string;
  chave?: 'PK' | 'FK';
}

interface DefinicaoEntidade
{
  nome: string;
  subdominio: string;
  status: StatusEntidade;
  origem: string;
  campos: CampoEntidade[];
  operacoes: string[];
}

interface RelacionamentoEntidade
{
  origem: string;
  destino: string;
  cardinalidadeOrigem: string;
  cardinalidadeDestino: string;
  rotulo: string;
  descontinuado?: boolean;
}

function campo ( nome: string, tipo: string, chave?: 'PK' | 'FK' ): CampoEntidade
{
  return { nome, tipo, chave };
}

const ROTULO_STATUS: Record < StatusEntidade, string > = {
  implementado: 'Implementado',
  documentado:  'Documentado (pendente)',
  inferido:     'Inferido (relatório de exemplo)',
  descartado:   'Descartado / simplificado',
};

const ENTIDADES: DefinicaoEntidade[] = [
  // ==================== Localização ====================
  {
    nome: 'Paises',
    subdominio: 'Localização',
    status: 'implementado',
    origem: 'Backend/src/modules/paises',
    campos: [
      campo ( 'codPais', 'int', 'PK' ),
      campo ( 'pais', 'string' ),
      campo ( 'sigla', 'string' ),
      campo ( 'ddi', 'string' ),
      campo ( 'moeda', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarPaises()', 'adicionarPaises()', 'editarPaises()', 'removerPaises()' ],
  },
  {
    nome: 'Estados',
    subdominio: 'Localização',
    status: 'implementado',
    origem: 'Backend/src/modules/estados',
    campos: [
      campo ( 'codEstado', 'int', 'PK' ),
      campo ( 'codPais', 'int', 'FK' ),
      campo ( 'uf', 'string' ),
      campo ( 'estado', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarEstados()', 'adicionarEstados()', 'editarEstado()', 'removerEstados()' ],
  },
  {
    nome: 'Cidades',
    subdominio: 'Localização',
    status: 'implementado',
    origem: 'Backend/src/modules/cidades',
    campos: [
      campo ( 'codCidade', 'int', 'PK' ),
      campo ( 'codEstado', 'int', 'FK' ),
      campo ( 'cidade', 'string' ),
      campo ( 'ddd', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarCidades()', 'adicionarCidade()', 'editarCidade()', 'removerCidade()' ],
  },

  // ==================== Parceiros ====================
  {
    nome: 'Fornecedores',
    subdominio: 'Parceiros',
    status: 'implementado',
    origem: 'Backend/src/modules/fornecedores',
    campos: [
      campo ( 'codForn', 'int', 'PK' ),
      campo ( 'codCidade', 'int', 'FK' ),
      campo ( 'fornecedor', 'string' ),
      campo ( 'nomeFantasia', 'string' ),
      campo ( 'tipoPessoa', 'string' ),
      campo ( 'enderecoForn', 'string' ),
      campo ( 'bairroForn', 'string' ),
      campo ( 'cepForn', 'string' ),
      campo ( 'foneForn', 'string' ),
      campo ( 'cpfCnpjForn', 'string' ),
      campo ( 'inscEstSubTrib', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarFornecedores()',
      'adicionarFornecedor()',
      'editarFornecedor()',
      'removerFornecedor()',
      'listarProdutosFornecedor()',
      'listarContasPagarFornecedor()',
    ],
  },
  {
    nome: 'Clientes',
    subdominio: 'Parceiros',
    status: 'implementado',
    origem: 'Backend/src/modules/clientes',
    campos: [
      campo ( 'codCliente', 'int', 'PK' ),
      campo ( 'codCidade', 'int', 'FK' ),
      campo ( 'codCondDePag', 'int', 'FK' ),
      campo ( 'cliente', 'string' ),
      campo ( 'tipoPessoa', 'string' ),
      campo ( 'enderecoCl', 'string' ),
      campo ( 'bairroCl', 'string' ),
      campo ( 'cepCl', 'string' ),
      campo ( 'foneCl', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarClientes()', 'adicionarCliente()', 'editarCliente()', 'removerCliente()' ],
  },
  {
    nome: 'Transportadoras',
    subdominio: 'Parceiros',
    status: 'implementado',
    origem: 'Backend/src/modules/transportadoras',
    campos: [
      campo ( 'codTransp', 'int', 'PK' ),
      campo ( 'codCidade', 'int', 'FK' ),
      campo ( 'codVeiculo', 'int', 'FK' ),
      campo ( 'transportadora', 'string' ),
      campo ( 'nomeFantasia', 'string' ),
      campo ( 'tipoPessoa', 'string' ),
      campo ( 'enderecoTransp', 'string' ),
      campo ( 'cpfCnpjTransp', 'string' ),
      campo ( 'inscEstTransp', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarTransportadoras()',
      'adicionarTransportadora()',
      'editarTransportadora()',
      'removerTransportadora()',
      'consultarVeiculos()',
    ],
  },

  // ==================== Produtos e Catálogo ====================
  {
    nome: 'Categorias',
    subdominio: 'Produtos e Catálogo',
    status: 'implementado',
    origem: 'Backend/src/modules/categorias',
    campos: [
      campo ( 'codCategoria', 'int', 'PK' ),
      campo ( 'categoria', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarCategorias()', 'adicionarCategoria()', 'editarCategoria()', 'removerCategoria()' ],
  },
  {
    nome: 'Produtos',
    subdominio: 'Produtos e Catálogo',
    status: 'implementado',
    origem:
      'Backend/src/modules/produtos — codCategoria é FK direta 1:N; a associativa ' +
      'ProdutoCategoria do diagrama original não foi implementada (ver entidade descartada)',
    campos: [
      campo ( 'codProd', 'int', 'PK' ),
      campo ( 'codCategoria', 'int', 'FK' ),
      campo ( 'produto', 'string' ),
      campo ( 'undProduto', 'string' ),
      campo ( 'estoque', 'int' ),
      campo ( 'pesoBruto', 'decimal' ),
      campo ( 'pesoLiq', 'decimal' ),
      campo ( 'saldoProd', 'decimal' ),
      campo ( 'custoMedioProd', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarProdutos()',
      'adicionarProduto()',
      'editarProduto()',
      'removerProduto()',
      'consultarFornecedores()',
      'consultarCategorias()',
    ],
  },
  {
    nome: 'ProdutoFornecedor',
    subdominio: 'Produtos e Catálogo',
    status: 'implementado',
    origem: 'Backend/src/modules/fornecedores/fornecedores.repository.ts (associativa N:N)',
    campos: [
      campo ( 'codProd', 'int', 'FK' ),
      campo ( 'codForn', 'int', 'FK' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [
      'inserirProdutoFornecedor()',
      'editarProdutoFornecedor()',
      'removerProdutoFornecedor()',
      'listarProdutosFornecedor()',
    ],
  },

  // ==================== Logística ====================
  {
    nome: 'Veiculos',
    subdominio: 'Logística',
    status: 'implementado',
    origem: 'Backend/src/modules/veiculos',
    campos: [
      campo ( 'codVeiculo', 'int', 'PK' ),
      campo ( 'codEstado', 'int', 'FK' ),
      campo ( 'modeloVeiculo', 'string' ),
      campo ( 'marca', 'string' ),
      campo ( 'placaVeiculo', 'string' ),
      campo ( 'placaMercoSul', 'string' ),
      campo ( 'codAntt', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarVeiculos()',
      'adicionarVeiculo()',
      'editarVeiculo()',
      'removerVeiculo()',
      'consultarEstados()',
    ],
  },
  {
    nome: 'VeiculoNfe',
    subdominio: 'Logística',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#veiculonfe — depende do módulo fiscal (Fase 4)',
    campos: [ campo ( 'codNfe', 'int', 'FK' ), campo ( 'codVeiculo', 'int', 'FK' ), campo ( 'codForn', 'int', 'FK' ) ],
    operacoes: [ 'vincularVeiculoNfe()', 'desvincularVeiculoNfe()' ],
  },

  // ==================== Financeiro ====================
  {
    nome: 'CondicaoDePagamento',
    subdominio: 'Financeiro',
    status: 'implementado',
    origem: 'Backend/src/modules/condicoes-pagamento',
    campos: [
      campo ( 'codCondDePag', 'int', 'PK' ),
      campo ( 'descricao', 'string' ),
      campo ( 'juroCondPag', 'decimal' ),
      campo ( 'multaCondPag', 'decimal' ),
      campo ( 'descontoCondPag', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarCondicaoPagamento()',
      'adicionarCondicaoPagamento()',
      'editarCondicaoPagamento()',
      'consultarParcelas()',
      'removerCondicaoPagamento()',
    ],
  },
  {
    nome: 'FormaDePagamento',
    subdominio: 'Financeiro',
    status: 'implementado',
    origem: 'Backend/src/modules/formas-pagamento',
    campos: [
      campo ( 'codFormaDePag', 'int', 'PK' ),
      campo ( 'formaDePag', 'string' ),
      campo ( 'prazoCompensacao', 'int' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarFormasDePagamento()',
      'adicionarFormasDePagamento()',
      'removerFormasDePagamento()',
      'editarFormasDePagamento()',
    ],
  },
  {
    nome: 'Parcelas',
    subdominio: 'Financeiro',
    status: 'implementado',
    origem: 'Backend/src/modules/parcelas',
    campos: [
      campo ( 'codParcela', 'int', 'PK' ),
      campo ( 'codCondDePag', 'int', 'FK' ),
      campo ( 'codFormaDePag', 'int', 'FK' ),
      campo ( 'percentual', 'decimal' ),
      campo ( 'numDias', 'int' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarParcelas()', 'adicionarParcelas()', 'removerParcelas()', 'editarParcelas()' ],
  },
  {
    nome: 'ContasAPagar',
    subdominio: 'Financeiro',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#contasapagar — próximo passo (Fase 3B)',
    campos: [
      campo ( 'codContasAPag', 'int', 'PK' ),
      campo ( 'codNfe', 'int', 'FK' ),
      campo ( 'codFornecedor', 'int', 'FK' ),
      campo ( 'codParcela', 'int', 'FK' ),
      campo ( 'vencFatura', 'date' ),
      campo ( 'vlrFatura', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarContasPagar()',
      'adicionarContaPagar()',
      'editarContaPagar()',
      'removerContaPagar()',
      'consultarParcelas()',
      'registrarContaPaga()',
    ],
  },
  {
    nome: 'ContasAReceber',
    subdominio: 'Financeiro',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#contasareceber — próximo passo (Fase 3B)',
    campos: [
      campo ( 'codContasARec', 'int', 'PK' ),
      campo ( 'codNfe', 'int', 'FK' ),
      campo ( 'codCliente', 'int', 'FK' ),
      campo ( 'codFormaDePag', 'int', 'FK' ),
      campo ( 'dtEmissao', 'date' ),
      campo ( 'vencRecibo', 'date' ),
      campo ( 'dtPagamento', 'date' ),
      campo ( 'vlrRecibo', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarContasReceber()',
      'adicionarContaReceber()',
      'editarContaReceber()',
      'removerContaReceber()',
      'registrarPagamentoRecebido()',
    ],
  },

  // ==================== Compras ====================
  {
    nome: 'Compras',
    subdominio: 'Compras',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#6-compras — Fase 4 (transacional)',
    campos: [
      campo ( 'codCompra', 'int', 'PK' ),
      campo ( 'codNfe', 'int', 'FK' ),
      campo ( 'codForn', 'int', 'FK' ),
      campo ( 'codTransp', 'int', 'FK' ),
      campo ( 'codCondDePag', 'int', 'FK' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarCompras()',
      'adicionarCompra()',
      'cancelarCompra()',
      'consultarNotaFiscal()',
      'consultarCondicoesPagamento()',
      'realizarCompra()',
      'gerarNotaFiscal()',
    ],
  },
  {
    nome: 'CompraProduto',
    subdominio: 'Compras',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#compraproduto — associativa (Fase 4)',
    campos: [
      campo ( 'codCompra', 'int', 'FK' ),
      campo ( 'codProduto', 'int', 'FK' ),
      campo ( 'custoMedioProduto', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [
      'consultarCompraProdutos()',
      'adicionarCompraProduto()',
      'editarCompraProduto()',
      'removerCompraProduto()',
    ],
  },

  // ==================== Fiscal ====================
  {
    nome: 'NotasFiscaisEletronicas',
    subdominio: 'Fiscal',
    status: 'documentado',
    origem:
      'docs/05-modelo-de-dominio.md#7-fiscal-nf-e — Fase 4; campos tributários completos em ' +
      'docs/06-modelo-de-dados.md (resumidos aqui)',
    campos: [
      campo ( 'codNfe', 'int', 'PK' ),
      campo ( 'modelo', 'string' ),
      campo ( 'numSerie', 'string' ),
      campo ( 'codFornecedor', 'int', 'FK' ),
      campo ( 'codTransportadora', 'int', 'FK' ),
      campo ( 'dhEmiNfe', 'datetime' ),
      campo ( 'dhSaiNfe', 'datetime' ),
      campo ( 'naturezaOp', 'string' ),
      campo ( 'chaveAcessoNfe', 'string' ),
      campo ( 'fretePorConta', 'string' ),
      campo ( 'cfopNfe', 'string' ),
      campo ( 'vlrProdNfe', 'decimal' ),
      campo ( 'aliqIcmsProdNfe', 'decimal' ),
      campo ( 'aliqIpiProdNfe', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarNotaFiscal()',
      'adicionarNotaFiscal()',
      'editarNotaFiscal()',
      'cancelarNotaFiscal()',
      'solicitarNotaFiscal()',
      'confirmarEntregaProduto()',
    ],
  },
  {
    nome: 'ProdutoNfe',
    subdominio: 'Fiscal',
    status: 'documentado',
    origem:
      'docs/05-modelo-de-dominio.md#produtonfe — associativa (Fase 4); campos tributários ' +
      'completos em docs/06-modelo-de-dados.md (resumidos aqui)',
    campos: [
      campo ( 'codNfe', 'int', 'FK' ),
      campo ( 'codProduto', 'int', 'FK' ),
      campo ( 'prodQtdNfe', 'decimal' ),
      campo ( 'prodVlrUnNfe', 'decimal' ),
      campo ( 'prodVlrIcmsNfe', 'decimal' ),
      campo ( 'prodVlrIpiNfe', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [ 'adicionarProdutoNfe()', 'removerProdutoNfe()', 'listarProdutosNfe()' ],
  },

  // ==================== Acesso ====================
  {
    nome: 'Users',
    subdominio: 'Acesso',
    status: 'documentado',
    origem: 'docs/05-modelo-de-dominio.md#8-acesso-e-usuarios — login adiado (Fase 5)',
    campos: [
      campo ( 'codUser', 'int', 'PK' ),
      campo ( 'perfil', 'string' ),
      campo ( 'user', 'string' ),
      campo ( 'email', 'string' ),
      campo ( 'senha', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'entrarConta()',
      'sairConta()',
      'registrarConta()',
      'editarConta()',
      'mudarSenha()',
      'excluirConta()',
    ],
  },

  // ==================== Descartados (simplificações de design) ====================
  {
    nome: 'ProdutoCategoria',
    subdominio: 'Descartados',
    status: 'descartado',
    origem:
      'Diagrama original (Visual Paradigm) — substituída pela FK direta Produtos.codCategoria ' +
      '(1:N); nunca chegou a ser usada pelos módulos',
    campos: [ campo ( 'codProduto', 'int', 'FK' ), campo ( 'codCategoria', 'int', 'FK' ) ],
    operacoes: [],
  },
  {
    nome: 'NCM_SH',
    subdominio: 'Descartados',
    status: 'descartado',
    origem:
      'Diagrama original — classificação fiscal/tributária fora do escopo do MVP ' +
      '(docs/06-modelo-de-dados.md#princípios-de-modelagem)',
    campos: [ campo ( 'codNcmSH', 'int', 'PK' ), campo ( 'codNcm', 'string' ), campo ( 'produtoNcmSH', 'string' ) ],
    operacoes: [],
  },

  // ==================== Ordem de Serviço (inferido) ====================
  {
    nome: 'Equipamentos',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md (Fase OS) + relatório de exemplo §5.8 Equipamento — ' +
      'ainda não modelado em docs/05',
    campos: [
      campo ( 'codEquipamento', 'int', 'PK' ),
      campo ( 'codCliente', 'int', 'FK' ),
      campo ( 'tipo', 'string' ),
      campo ( 'marca', 'string' ),
      campo ( 'modelo', 'string' ),
      campo ( 'numeroSerie', 'string' ),
      campo ( 'senha', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarEquipamentos()',
      'adicionarEquipamento()',
      'editarEquipamento()',
      'removerEquipamento()',
    ],
  },
  {
    nome: 'ProblemasRelatados',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido do relatório de exemplo §5.17 Problema relatado — sem equivalente em docs/05; ' +
      'catálogo de defeitos comuns referenciado pela Ordem de Serviço',
    campos: [
      campo ( 'codProblemaRelatado', 'int', 'PK' ),
      campo ( 'descricao', 'string' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarProblemasRelatados()',
      'adicionarProblemaRelatado()',
      'editarProblemaRelatado()',
      'removerProblemaRelatado()',
    ],
  },
  {
    nome: 'Servicos',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md ("serviços executados: descrição e valor") + relatório ' +
      'de exemplo §5.19 Serviços — catálogo análogo a Produtos',
    campos: [
      campo ( 'codServico', 'int', 'PK' ),
      campo ( 'servico', 'string' ),
      campo ( 'valorServico', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarServicos()', 'adicionarServico()', 'editarServico()', 'removerServico()' ],
  },
  {
    nome: 'OrdemServico',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md (Fase OS — ciclo de vida e campos principais) + relatório ' +
      'de exemplo §5.15 Ordem de Serviço — módulo central da Kaneko Informática, ainda sem ' +
      'atributos detalhados em docs/05',
    campos: [
      campo ( 'codOS', 'int', 'PK' ),
      campo ( 'codCliente', 'int', 'FK' ),
      campo ( 'codEquipamento', 'int', 'FK' ),
      campo ( 'codProblemaRelatado', 'int', 'FK' ),
      campo ( 'codUserTecnico', 'int', 'FK' ),
      campo ( 'codCondDePag', 'int', 'FK' ),
      campo ( 'status', 'string' ),
      campo ( 'laudoTecnico', 'string' ),
      campo ( 'observacoesInternas', 'string' ),
      campo ( 'prazoEntregaPrevisto', 'date' ),
      campo ( 'dtEntregaReal', 'date' ),
      campo ( 'garantiaDias', 'int' ),
      campo ( 'vlrTotalOS', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [
      'consultarOrdensServico()',
      'abrirOrdemServico()',
      'avancarStatusOrdemServico()',
      'cancelarOrdemServico()',
      'consultarProximaOrdemServico()',
      'encerrarOrdemServico()',
    ],
  },
  {
    nome: 'OrdemServicoServico',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md ("Serviços executados: descrição e valor por linha de ' +
      'serviço") — associativa OrdemServico × Servicos',
    campos: [
      campo ( 'codOS', 'int', 'FK' ),
      campo ( 'codServico', 'int', 'FK' ),
      campo ( 'descricaoExecucao', 'string' ),
      campo ( 'valorCobrado', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [ 'adicionarServicoOS()', 'removerServicoOS()' ],
  },
  {
    nome: 'OrdemServicoProduto',
    subdominio: 'Ordem de Serviço',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md ("Peças utilizadas: referencia Produtos + quantidade + ' +
      'valor unitário") — associativa OrdemServico × Produtos',
    campos: [
      campo ( 'codOS', 'int', 'FK' ),
      campo ( 'codProduto', 'int', 'FK' ),
      campo ( 'quantidade', 'decimal' ),
      campo ( 'valorUnitario', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [ 'adicionarPecaOS()', 'removerPecaOS()' ],
  },

  // ==================== Vendas (inferido) ====================
  {
    nome: 'Vendas',
    subdominio: 'Vendas',
    status: 'inferido',
    origem:
      'Inferido de docs/09-roadmap.md (Fase 5 — "fluxos completos de venda", decisão adiada) + ' +
      'relatório de exemplo §5.21 Vendas, por simetria com Compras/CompraProduto',
    campos: [
      campo ( 'codVenda', 'int', 'PK' ),
      campo ( 'codCliente', 'int', 'FK' ),
      campo ( 'codNfe', 'int', 'FK' ),
      campo ( 'codCondDePag', 'int', 'FK' ),
      campo ( 'dtVenda', 'date' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'dtEdicao', 'datetime' ),
      campo ( 'codUser', 'int' ),
      campo ( 'isActive', 'bool' ),
    ],
    operacoes: [ 'consultarVendas()', 'adicionarVenda()', 'cancelarVenda()', 'consultarDetalhesVenda()' ],
  },
  {
    nome: 'VendaProduto',
    subdominio: 'Vendas',
    status: 'inferido',
    origem: 'Inferido por simetria com CompraProduto — associativa Vendas × Produtos',
    campos: [
      campo ( 'codVenda', 'int', 'FK' ),
      campo ( 'codProduto', 'int', 'FK' ),
      campo ( 'quantidade', 'decimal' ),
      campo ( 'vlrUnitario', 'decimal' ),
      campo ( 'dtCriacao', 'datetime' ),
      campo ( 'codUser', 'int' ),
    ],
    operacoes: [ 'adicionarVendaProduto()', 'removerVendaProduto()' ],
  },
];

const RELACIONAMENTOS: RelacionamentoEntidade[] = [
  // Localização
  { origem: 'Paises', destino: 'Estados', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'possui' },
  { origem: 'Estados', destino: 'Cidades', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'possui' },
  { origem: 'Cidades', destino: 'Fornecedores', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'sedia' },
  { origem: 'Cidades', destino: 'Clientes', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'sedia' },
  { origem: 'Cidades', destino: 'Transportadoras', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'sedia' },
  { origem: 'Estados', destino: 'Veiculos', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'licencia' },
  { origem: 'Veiculos', destino: 'Transportadoras', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é usado por' },

  // Produtos e Catálogo
  { origem: 'Categorias', destino: 'Produtos', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'classifica' },
  { origem: 'Produtos', destino: 'ProdutoFornecedor', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é fornecido em' },
  { origem: 'Fornecedores', destino: 'ProdutoFornecedor', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'fornece' },

  // Financeiro
  { origem: 'CondicaoDePagamento', destino: 'Clientes', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'concede' },
  { origem: 'CondicaoDePagamento', destino: 'Parcelas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'parcela em' },
  { origem: 'FormaDePagamento', destino: 'Parcelas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'recebe por' },
  { origem: 'Fornecedores', destino: 'ContasAPagar', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'gera' },
  { origem: 'Parcelas', destino: 'ContasAPagar', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'vence conforme' },
  { origem: 'NotasFiscaisEletronicas', destino: 'ContasAPagar', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'origina' },
  { origem: 'Clientes', destino: 'ContasAReceber', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'gera' },
  { origem: 'FormaDePagamento', destino: 'ContasAReceber', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'recebe por' },
  { origem: 'NotasFiscaisEletronicas', destino: 'ContasAReceber', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'origina' },

  // Compras
  { origem: 'Fornecedores', destino: 'Compras', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'fornece em' },
  { origem: 'Transportadoras', destino: 'Compras', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'transporta em' },
  { origem: 'CondicaoDePagamento', destino: 'Compras', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'financia' },
  { origem: 'Compras', destino: 'NotasFiscaisEletronicas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..1', rotulo: 'gera' },
  { origem: 'Compras', destino: 'CompraProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'contém' },
  { origem: 'Produtos', destino: 'CompraProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é comprado em' },

  // Fiscal
  { origem: 'Fornecedores', destino: 'NotasFiscaisEletronicas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'emite' },
  { origem: 'Transportadoras', destino: 'NotasFiscaisEletronicas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'transporta' },
  { origem: 'Veiculos', destino: 'VeiculoNfe', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'transporta em' },
  { origem: 'NotasFiscaisEletronicas', destino: 'VeiculoNfe', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'referencia' },
  { origem: 'Produtos', destino: 'ProdutoNfe', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é item de' },
  { origem: 'NotasFiscaisEletronicas', destino: 'ProdutoNfe', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'detalha' },

  // Descartados
  { origem: 'Produtos', destino: 'ProdutoCategoria', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'descontinuado', descontinuado: true },
  { origem: 'Categorias', destino: 'ProdutoCategoria', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'descontinuado', descontinuado: true },
  { origem: 'Produtos', destino: 'NCM_SH', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'removido do escopo', descontinuado: true },

  // Ordem de Serviço
  { origem: 'Clientes', destino: 'Equipamentos', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'possui' },
  { origem: 'Clientes', destino: 'OrdemServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'solicita' },
  { origem: 'Equipamentos', destino: 'OrdemServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é atendido em' },
  { origem: 'ProblemasRelatados', destino: 'OrdemServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'descreve' },
  { origem: 'Users', destino: 'OrdemServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'atende como técnico' },
  { origem: 'CondicaoDePagamento', destino: 'OrdemServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'financia' },
  { origem: 'OrdemServico', destino: 'OrdemServicoServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'detalha' },
  { origem: 'Servicos', destino: 'OrdemServicoServico', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é executado em' },
  { origem: 'OrdemServico', destino: 'OrdemServicoProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'detalha' },
  { origem: 'Produtos', destino: 'OrdemServicoProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é usado como peça em' },
  { origem: 'OrdemServico', destino: 'ContasAReceber', cardinalidadeOrigem: '0..*', cardinalidadeDestino: '0..1', rotulo: 'gera ao encerrar' },

  // Vendas
  { origem: 'Clientes', destino: 'Vendas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'realiza' },
  { origem: 'CondicaoDePagamento', destino: 'Vendas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'financia' },
  { origem: 'Vendas', destino: 'NotasFiscaisEletronicas', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..1', rotulo: 'gera' },
  { origem: 'Vendas', destino: 'VendaProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'contém' },
  { origem: 'Produtos', destino: 'VendaProduto', cardinalidadeOrigem: '1', cardinalidadeDestino: '0..*', rotulo: 'é vendido em' },
];

function formatarClasse ( entidade: DefinicaoEntidade ): string
{
  const linhasCampos = entidade.campos.map ( ( campoAtual ) =>
  {
    const sufixoChave = campoAtual.chave ? ` ${ campoAtual.chave }` : '';
    return `        +${ campoAtual.tipo } ${ campoAtual.nome }${ sufixoChave }`;
  } );

  const linhasOperacoes = entidade.operacoes.map ( ( operacao ) => `        +${ operacao }` );

  return [
    `    %% origem: ${ entidade.origem }`,
    `    class ${ entidade.nome } {`,
    ...linhasCampos,
    ...linhasOperacoes,
    `    }`,
  ].join ( '\n' );
}

function formatarRelacionamento ( relacionamento: RelacionamentoEntidade ): string
{
  const seta = relacionamento.descontinuado ? '..>' : '-->';

  return (
    `    ${ relacionamento.origem } "${ relacionamento.cardinalidadeOrigem }" ${ seta } ` +
    `"${ relacionamento.cardinalidadeDestino }" ${ relacionamento.destino } : ${ relacionamento.rotulo }`
  );
}

function formatarClasseComStatus ( entidade: DefinicaoEntidade ): string
{
  return `    class ${ entidade.nome }:::${ entidade.status }`;
}

function gerarDiagramaMermaid (): string
{
  const subdominios = [ ...new Set ( ENTIDADES.map ( ( entidade ) => entidade.subdominio ) ) ];
  const linhas: string[] = [ 'classDiagram' ];

  for ( const subdominio of subdominios )
  {
    linhas.push ( '' );
    linhas.push ( `    %% ==================== ${ subdominio } ====================` );

    for ( const entidade of ENTIDADES.filter ( ( item ) => item.subdominio === subdominio ) )
    {
      linhas.push ( formatarClasse ( entidade ) );
    }
  }

  linhas.push ( '' );
  linhas.push ( '    %% ==================== Relacionamentos ====================' );

  for ( const relacionamento of RELACIONAMENTOS )
  {
    linhas.push ( formatarRelacionamento ( relacionamento ) );
  }

  linhas.push ( '' );
  linhas.push ( '    %% ==================== Status de implementação ====================' );

  for ( const entidade of ENTIDADES )
  {
    linhas.push ( formatarClasseComStatus ( entidade ) );
  }

  linhas.push ( '' );
  linhas.push ( '    classDef implementado fill:#c9f2d8,stroke:#1b7a43,color:#0b3d24,stroke-width:1px' );
  linhas.push ( '    classDef documentado fill:#ffe9a8,stroke:#a9760a,color:#5c3d00,stroke-width:1px' );
  linhas.push (
    '    classDef inferido fill:#e3d9fb,stroke:#6c4bd6,color:#3a2570,stroke-width:1px,stroke-dasharray: 4 3'
  );
  linhas.push (
    '    classDef descartado fill:#eeeeee,stroke:#999999,color:#666666,stroke-width:1px,stroke-dasharray: 2 2'
  );

  return linhas.join ( '\n' );
}

function montarDocumentoMarkdown ( diagrama: string ): string
{
  const linhasTabela = ENTIDADES.map ( ( entidade ) =>
    `| ${ entidade.nome } | ${ entidade.subdominio } | ${ ROTULO_STATUS[ entidade.status ] } | ${ entidade.origem } |`
  ).join ( '\n' );

  return `# 13 — Diagrama de Classes (Mermaid)

Diagrama de classes do sistema, gerado a partir de \`docs/relatorio/scripts/gerarDiagramaMermaid.ts\`.
Reflete três fontes, na ordem de precedência descrita em
[docs/09-roadmap.md](09-roadmap.md):

1. **Implementado** — lido do schema real (\`Backend/src/db/types\`, gerado pelo kanel) e dos
   módulos em \`Backend/src/modules\`.
2. **Documentado (pendente)** — modelado em [docs/05-modelo-de-dominio.md](05-modelo-de-dominio.md)
   e [docs/06-modelo-de-dados.md](06-modelo-de-dados.md), mas ainda sem backend/frontend.
3. **Inferido (relatório de exemplo)** — não modelado em docs/05 (apenas citado como bullet points
   em docs/09-roadmap.md, sem atributos); estrutura inferida a partir do relatório de exemplo
   "Eletrônica Flay Back" para o módulo de Ordem de Serviço e Vendas.

Também aparecem entidades **descartadas**: constavam no diagrama original (Visual Paradigm) mas
foram simplificadas ou removidas do escopo (ver
[docs/06-modelo-de-dados.md](06-modelo-de-dados.md#princípios-de-modelagem)).

Para regenerar após mudanças no schema ou no roadmap (sem depender do Backend — o script
não usa nenhuma dependência além do Node, então roda direto via \`npx\`):

\`\`\`bash
cd docs/relatorio
npx -y tsx scripts/gerarDiagramaMermaid.ts
\`\`\`

## Legenda de status

| Entidade | Subdomínio | Status | Origem |
|----------|------------|--------|--------|
${ linhasTabela }

## Diagrama

\`\`\`mermaid
${ diagrama }
\`\`\`
`;
}

function main (): void
{
  const diretorioAtual = dirname ( fileURLToPath ( import.meta.url ) );
  const caminhoRaizDocs = resolve ( diretorioAtual, '../..' );

  const diagrama = gerarDiagramaMermaid ();

  const caminhoImg = resolve ( caminhoRaizDocs, 'relatorio/img' );
  mkdirSync ( caminhoImg, { recursive: true } );

  const caminhoMmd = resolve ( caminhoImg, 'diagrama-mermaid.mmd' );
  writeFileSync ( caminhoMmd, `${ diagrama }\n`, 'utf-8' );

  const caminhoMarkdown = resolve ( caminhoRaizDocs, '13-diagrama-mermaid.md' );
  writeFileSync ( caminhoMarkdown, montarDocumentoMarkdown ( diagrama ), 'utf-8' );

  console.log ( `Diagrama gerado em:\n  ${ caminhoMmd }\n  ${ caminhoMarkdown }` );
}

main ();
