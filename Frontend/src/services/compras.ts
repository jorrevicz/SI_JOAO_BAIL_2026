import api from './api';

// Chave natural da compra: documento (número, modelo, série) + fornecedor.
export interface CompraId
{
  numero:  string;
  modelo:  string;
  serie:   string;
  codForn: number;
}

// Linha da listagem (GET /api/compras).
export interface Compra extends CompraId
{
  codForn:                   number;
  fornecedor:                string;
  codTransp:                 number | null;
  codCondDePag:              number;
  dtEmissao:                 string;
  dtChegada:                 string;
  dtEntrada:                 string;
  frete:                     string;
  seguro:                    string;
  despesas:                  string;
  vlrTotal:                  string;
  // NF-e da compra (mesmas chaves da compra; null se não houver) — RN002/RN003.
  situacaoNotaFiscal:        'Gerada' | 'Cancelada' | null;
  justificativaCancelamento: string | null;
  dtCriacao:                 string;
  dtEdicao:                  string;
  codUser:                   number | null;
  isActive:                  boolean;
}

export interface ItemCompra
{
  codProduto:        number;
  produto:           string;
  undProduto:        string;
  estoque:           number;
  precoVenda:        string;
  quantidade:        number;
  valorUnitario:     string;
  desconto:          string;
  percentualRateio:  string;
  valorRateio:       string;
  custoMedioProduto: string;
  // RN020 — unidade do item nesta compra (pode diferir de `undProduto`, a do cadastro).
  unidade:           string;
}

// RN023 — parcela própria da compra (não altera a condição de pagamento nem suas Parcelas).
export interface ParcelaCompra
{
  numParcela:    number;
  codFormaDePag: number;
  formaDePag:    string;
  valor:         string;
  dtVencimento:  string;
}

// Detalhe (GET /api/compras/:numero/:modelo/:serie): cabeçalho com as descrições das FKs + itens.
export interface CompraDetalhe extends Compra
{
  transportadora:    string | null;
  condicaoPagamento: string | null;
  itens:             ItemCompra[];
  parcelas:          ParcelaCompra[];
}

export interface ItemCompraInput
{
  codProduto:    number;
  quantidade:    number;
  valorUnitario: string;
  desconto:      string;
  unidade:       string;
}

export interface ParcelaCompraInput
{
  numParcela:    number;
  codFormaDePag: number;
  valor:         string;
  dtVencimento:  string;
}

// Dados da compra além da chave natural (CompraId); o fornecedor faz parte da chave.
export interface CabecalhoCompraInput
{
  codTransp:    number | null;
  codCondDePag: number;
  dtEmissao:    string;
  dtChegada:    string;
  frete:        string;
  seguro:       string;
  despesas:     string;
  itens:        ItemCompraInput[];
  parcelas:     ParcelaCompraInput[];
}

export type CreateCompraInput = CompraId & CabecalhoCompraInput;

export interface CalculoCompraInput
{
  frete:    string;
  seguro:   string;
  despesas: string;
  itens:    Omit < ItemCompraInput, 'unidade' >[];
}

// RN022 — pedido de geração das parcelas: mesmos dados da prévia + condição e emissão.
export interface GerarParcelasInput extends CalculoCompraInput
{
  codCondDePag: number;
  dtEmissao:    string;
}

export interface ParcelasGeradas
{
  vlrTotal: string;
  parcelas: Array < Omit < ParcelaCompraInput, 'dtVencimento' > & { dtVencimento: string } >;
}

// Prévia calculada pelo Backend (POST /api/compras/calculo) — o Frontend não faz conta.
export interface ItemCalculado extends ItemCompraInput
{
  valorLiquido:         string;
  percentualRateio:     string;
  valorRateio:          string;
  custoMedioProduto:    string;
  produto:              string;
  undProduto:           string;
  estoqueAtual:         number;
  estoqueResultante:    number;
  custoMedioResultante: string;
  precoVenda:           string;
}

export interface CalculoCompra
{
  totalProdutos:  string;
  totalDescontos: string;
  vlrTotal:       string;
  totalQuantidade:       number;
  totalValorUnitario:    string;
  itens:          ItemCalculado[];
}

const caminho = ( id: CompraId ) => `/api/compras/${ id.numero }/${ id.modelo }/${ id.serie }/${ id.codForn }`;

export const comprasService = {
  listar: (
    params?: { codForn?: number; limit?: number }
  ) => api
    .get < Compra[] > ( '/api/compras', { params: { limit: 100, ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: CompraId
  ) => api
    .get < CompraDetalhe > ( caminho ( id ) )
    .then ( ( resposta ) => resposta.data ),

  validarChave: (
    chave: CompraId
  ) => api
    .get < { valido: boolean } > ( '/api/compras/validar', { params: chave } )
    .then ( ( resposta ) => resposta.data ),

  calcular: (
    dados: CalculoCompraInput
  ) => api
    .post < CalculoCompra > ( '/api/compras/calculo', dados )
    .then ( ( resposta ) => resposta.data ),

  gerarParcelas: (
    dados: GerarParcelasInput
  ) => api
    .post < ParcelasGeradas > ( '/api/compras/parcelas', dados )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateCompraInput
  ) => api
    .post < CompraDetalhe > ( '/api/compras', dados )
    .then ( ( resposta ) => resposta.data ),

  cancelar: (
    id:    CompraId,
    dados: { justificativaCancelamento: string }
  ) => api
    .patch < CompraDetalhe > ( `${ caminho ( id ) }/cancelar`, dados )
    .then ( ( resposta ) => resposta.data ),
};
