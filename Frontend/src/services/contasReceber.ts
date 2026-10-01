import api from './api';

export interface ContaAReceberId
{
  numero:  string;
  modelo:  string;
  serie:   string;
  parcela: number;
}

export interface ContaAReceber
{
  numero:                     string;
  modelo:                     string;
  serie:                      string;
  parcela:                    number;
  codCliente:                  number;
  codFormaDePag:               number;
  dtEmissao:                   string | null;
  dtVencimento:                string | null;
  valor:                       string;
  juro:                        string;
  desconto:                    string;
  multa:                       string;
  valorBaixa:                  string | null;
  dtBaixa:                     string | null;
  dtPagamento:                 string | null;
  justificativaCancelamento:   string | null;
  dtCriacao:                   string;
  dtEdicao:                    string;
  codUser:                     number | null;
  isActive:                    boolean;
}

export interface CreateContaAReceberInput
{
  numero:        string;
  modelo:        string;
  serie:         string;
  parcela:       number;
  codCliente:    number;
  codFormaDePag: number;
  dtEmissao:     string;
  dtVencimento:  string;
  valor:         string;
  juro:          string;
  desconto:      string;
  multa:         string;
  isActive:      boolean;
}

export type UpdateContaAReceberInput = CreateContaAReceberInput;

export interface RegistrarPagamentoRecebidoInput
{
  valorBaixa:  string;
  dtBaixa:     string;
  dtPagamento: string;
}

export interface CancelarContaAReceberInput
{
  justificativaCancelamento: string;
}

export interface ChaveDocumentoFiscal
{
  numero: string;
  modelo: string;
  serie:  string;
}

function montarPath ( id: ContaAReceberId )
{
  return `${ id.numero }/${ id.modelo }/${ id.serie }/${ id.parcela }`;
}

export const contasReceberService = {
  listar: (
    params?: { limit?: number }
  ) => api
    .get < ContaAReceber[] > ( '/api/contas-receber', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: ContaAReceberId
  ) => api
    .get < ContaAReceber > ( `/api/contas-receber/${ montarPath ( id ) }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateContaAReceberInput
  ) => api
    .post < ContaAReceber > ( '/api/contas-receber', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    ContaAReceberId,
    dados: UpdateContaAReceberInput
  ) => api
    .put < ContaAReceber > ( `/api/contas-receber/${ montarPath ( id ) }`, dados )
    .then ( ( resposta ) => resposta.data ),

  registrarPagamento: (
    id:    ContaAReceberId,
    dados: RegistrarPagamentoRecebidoInput
  ) => api
    .patch < ContaAReceber > ( `/api/contas-receber/${ montarPath ( id ) }/baixa`, dados )
    .then ( ( resposta ) => resposta.data ),

  cancelar: (
    id:    ContaAReceberId,
    dados: CancelarContaAReceberInput
  ) => api
    .patch < ContaAReceber > ( `/api/contas-receber/${ montarPath ( id ) }/cancelar`, dados )
    .then ( ( resposta ) => resposta.data ),

  validarChave: (
    chave: ChaveDocumentoFiscal
  ) => api
    .get < { valido: true } > ( '/api/contas-receber/validar', { params: chave } )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: ContaAReceberId
  ) => api
    .delete ( `/api/contas-receber/${ montarPath ( id ) }` ),
};
