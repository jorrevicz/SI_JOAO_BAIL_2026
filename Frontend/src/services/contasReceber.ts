import api from './api';

// Chave natural da conta: documento (número, modelo, série) + cliente + parcela.
export interface ContaAReceberId
{
  numero:     string;
  modelo:     string;
  serie:      string;
  codCliente: number;
  parcela:    number;
}

export interface ContaAReceber
{
  numero:                     string;
  modelo:                     string;
  serie:                      string;
  parcela:                    number;
  codCliente:                  number;
  codFormaDePag:               number;
  dtVencimento:                string | null;
  valor:                       string;
  juro:                        string;
  desconto:                    string;
  multa:                       string;
  valorBaixa:                  string;
  vlrTotal:                    string;
  dtBaixa:                     string;
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
  dtVencimento:  string;
  valor:         string;
  juro:          string;
  desconto:      string;
  multa:         string;
  // A conta nasce já baixada: não há edição nem baixa posterior, só cancelamento.
  valorBaixa:    string;
  dtBaixa:       string;
  isActive:      boolean;
}

export interface CancelarContaAReceberInput
{
  justificativaCancelamento: string;
}

function montarPath ( id: ContaAReceberId )
{
  return `${ id.numero }/${ id.modelo }/${ id.serie }/${ id.codCliente }/${ id.parcela }`;
}

export interface CalcularTotalContaInput
{
  valor:    string;
  juro:     string;
  multa:    string;
  desconto: string;
}

export const contasReceberService = {
  // Prévia do valor total: a conta é feita pelo Backend, o Frontend só exibe o resultado.
  calcularTotal: (
    dados: CalcularTotalContaInput
  ) => api
    .post < { vlrTotal: string } > ( '/api/contas-receber/calcular', dados )
    .then ( ( resposta ) => resposta.data ),

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

  cancelar: (
    id:    ContaAReceberId,
    dados: CancelarContaAReceberInput
  ) => api
    .patch < ContaAReceber > ( `/api/contas-receber/${ montarPath ( id ) }/cancelar`, dados )
    .then ( ( resposta ) => resposta.data ),

  validarChave: (
    chave: ContaAReceberId
  ) => api
    .get < { valido: true } > ( '/api/contas-receber/validar', { params: chave } )
    .then ( ( resposta ) => resposta.data )
};
