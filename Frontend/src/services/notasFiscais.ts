import api from './api';

// Opções do leiaute da NF-e (iguais às aceitas pelo Backend).
export const CSOSN_VALIDOS = [ '101', '102', '103', '201', '202', '203', '300', '400', '500', '900' ] as const;

export const FRETE_POR_CONTA = [
  'Emitente',
  'Destinatário',
  'Terceiros',
  'Próprio remetente',
  'Próprio destinatário',
  'Sem frete',
] as const;

// Chave da NF-e: as mesmas chaves da compra de origem (documento + fornecedor).
export interface NotaFiscalId
{
  numero:        string;
  modelo:        string;
  serie:         string;
  codFornecedor: number;
}

// Linha da listagem (GET /api/notas-fiscais). O total é calculado pelo Backend.
export interface NotaFiscal extends NotaFiscalId
{
  fornecedor:                string;
  chaveAcessoNfe:            string;
  dhEmiNfe:                  string;
  dhSaiNfe:                  string | null;
  fretePorConta:             string;
  infoCompl:                 string | null;
  frete:                     string;
  seguro:                    string;
  despesas:                  string;
  vlrTotalNota:              string;
  justificativaCancelamento: string | null;
  dtCriacao:                 string;
  dtEdicao:                  string;
  codUser:                   number | null;
  isActive:                  boolean;
}

// Tributação informada por item; quantidade, valor e desconto vêm da compra.
export interface TributacaoItemInput
{
  codProduto: number;
  cfop:       string;
  csosn:      string;
  aliqIcms:   string;
  aliqIpi:    string;
}

export interface ItemNotaFiscalCalculado extends TributacaoItemInput
{
  produto:       string;
  undProduto:    string;
  quantidade:    number;
  valorUnitario: string;
  desconto:      string;
  valorProduto:  string;
  baseIcms:      string;
  valorIcms:     string;
  valorIpi:      string;
}

export interface TotaisNotaFiscal
{
  totalProdutos:  string;
  totalDescontos: string;
  totalBaseIcms:  string;
  totalIcms:      string;
  totalIpi:       string;
  vlrTotalNota:   string;
}

// Prévia calculada pelo Backend (POST /api/notas-fiscais/calculo) — o Frontend não faz conta.
export interface CalculoNotaFiscal extends TotaisNotaFiscal
{
  itens: ItemNotaFiscalCalculado[];
}

// Detalhe (GET /api/notas-fiscais/:numero/:modelo/:serie/:codFornecedor): emitente e transporte vêm da compra de origem.
export interface NotaFiscalDetalhe extends NotaFiscal, TotaisNotaFiscal
{
  cpfCnpjForn:     string;
  inscEstSubTrib:  string;
  codTransp:       number | null;
  transportadora:  string | null;
  dtEmissaoCompra: string;
  dtChegada:       string;
  itens:           ItemNotaFiscalCalculado[];
}

export interface GerarNotaFiscalInput extends NotaFiscalId
{
  chaveAcessoNfe: string;
  dhEmiNfe:       string;
  dhSaiNfe:       string | null;
  fretePorConta:  string;
  infoCompl:      string | null;
  itens:          TributacaoItemInput[];
}

const caminho = ( id: NotaFiscalId ) => `/api/notas-fiscais/${ id.numero }/${ id.modelo }/${ id.serie }/${ id.codFornecedor }`;

export const notasFiscaisService = {
  listar: (
    params?: { codFornecedor?: number; limit?: number }
  ) => api
    .get < NotaFiscal[] > ( '/api/notas-fiscais', { params: { limit: 100, ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: NotaFiscalId
  ) => api
    .get < NotaFiscalDetalhe > ( caminho ( id ) )
    .then ( ( resposta ) => resposta.data ),

  calcular: (
    dados: NotaFiscalId & { itens: TributacaoItemInput[] }
  ) => api
    .post < CalculoNotaFiscal > ( '/api/notas-fiscais/calculo', dados )
    .then ( ( resposta ) => resposta.data ),

  gerar: (
    dados: GerarNotaFiscalInput
  ) => api
    .post < NotaFiscalDetalhe > ( '/api/notas-fiscais', dados )
    .then ( ( resposta ) => resposta.data ),

  cancelar: (
    id:    NotaFiscalId,
    dados: { justificativaCancelamento: string }
  ) => api
    .patch < NotaFiscalDetalhe > ( `${ caminho ( id ) }/cancelar`, dados )
    .then ( ( resposta ) => resposta.data ),
};
