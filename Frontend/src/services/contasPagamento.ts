import api from './api';

export interface ContaAPagarId
{
  numero:  string;
  modelo:  string;
  serie:   string;
  parcela: number;
}

export interface ContaAPagar
{
  numero:                     string;
  modelo:                     string;
  serie:                      string;
  parcela:                    number;
  codFornecedor:               number;
  codFormaDePag:               number;
  dtEmissao:                   string | null;
  dtVencimento:                string | null;
  valor:                       string;
  juro:                        string;
  desconto:                    string;
  multa:                       string;
  valorBaixa:                  string | null;
  dtBaixa:                     string | null;
  justificativaCancelamento:   string | null;
  dtCriacao:                   string;
  dtEdicao:                    string;
  codUser:                     number | null;
  isActive:                    boolean;
}

export interface CreateContaAPagarInput
{
  numero:        string;
  modelo:        string;
  serie:         string;
  parcela:       number;
  codFornecedor: number;
  codFormaDePag: number;
  dtEmissao?:    string;
  dtVencimento?: string;
  valor:         string;
  juro:          string;
  desconto:      string;
  multa:         string;
  isActive:      boolean;
}

export type UpdateContaAPagarInput = CreateContaAPagarInput;

export interface RegistrarBaixaContaAPagarInput
{
  valorBaixa: string;
  dtBaixa:    string;
}

export interface CancelarContaAPagarInput
{
  justificativaCancelamento: string;
}

export interface ChaveDocumentoFiscal
{
  numero: string;
  modelo: string;
  serie:  string;
}

function montarPath ( id: ContaAPagarId )
{
  return `${ id.numero }/${ id.modelo }/${ id.serie }/${ id.parcela }`;
}

export const contasPagamentoService = {
  listar: (
    params?: { limit?: number }
  ) => api
    .get < ContaAPagar[] > ( '/api/contas-pagamento', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: ContaAPagarId
  ) => api
    .get < ContaAPagar > ( `/api/contas-pagamento/${ montarPath ( id ) }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateContaAPagarInput
  ) => api
    .post < ContaAPagar > ( '/api/contas-pagamento', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    ContaAPagarId,
    dados: UpdateContaAPagarInput
  ) => api
    .put < ContaAPagar > ( `/api/contas-pagamento/${ montarPath ( id ) }`, dados )
    .then ( ( resposta ) => resposta.data ),

  registrarBaixa: (
    id:    ContaAPagarId,
    dados: RegistrarBaixaContaAPagarInput
  ) => api
    .patch < ContaAPagar > ( `/api/contas-pagamento/${ montarPath ( id ) }/baixa`, dados )
    .then ( ( resposta ) => resposta.data ),

  cancelar: (
    id:    ContaAPagarId,
    dados: CancelarContaAPagarInput
  ) => api
    .patch < ContaAPagar > ( `/api/contas-pagamento/${ montarPath ( id ) }/cancelar`, dados )
    .then ( ( resposta ) => resposta.data ),

  validarChave: (
    chave: ChaveDocumentoFiscal
  ) => api
    .get < { valido: true } > ( '/api/contas-pagamento/validar', { params: chave } )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: ContaAPagarId
  ) => api
    .delete ( `/api/contas-pagamento/${ montarPath ( id ) }` ),
};
