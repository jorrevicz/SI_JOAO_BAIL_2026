import api from './api';

// Chave natural da conta: documento (número, modelo, série) + fornecedor + parcela.
export interface ContaAPagarId
{
  numero:        string;
  modelo:        string;
  serie:         string;
  codFornecedor: number;
  parcela:       number;
}

export interface ContaAPagar
{
  numero:                     string;
  modelo:                     string;
  serie:                      string;
  parcela:                    number;
  codFornecedor:               number;
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

export interface CreateContaAPagarInput
{
  numero:        string;
  modelo:        string;
  serie:         string;
  parcela:       number;
  codFornecedor: number;
  codFormaDePag: number;
  dtVencimento:  string;
  valor:         string;
  juro:          string;
  desconto:      string;
  multa:         string;
  // A conta nasce já baixada: não há edição nem baixa posterior. O cancelamento só acontece
  // pela compra do mesmo documento (PATCH /api/compras/.../cancelar).
  valorBaixa:    string;
  dtBaixa:       string;
  isActive:      boolean;
}

function montarPath ( id: ContaAPagarId )
{
  return `${ id.numero }/${ id.modelo }/${ id.serie }/${ id.codFornecedor }/${ id.parcela }`;
}

export interface CalcularTotalContaInput
{
  valor:    string;
  juro:     string;
  multa:    string;
  desconto: string;
}

export const contasPagamentoService = {
  // Prévia do valor total: a conta é feita pelo Backend, o Frontend só exibe o resultado.
  calcularTotal: (
    dados: CalcularTotalContaInput
  ) => api
    .post < { vlrTotal: string } > ( '/api/contas-pagamento/calcular', dados )
    .then ( ( resposta ) => resposta.data ),

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

  validarChave: (
    chave: ContaAPagarId
  ) => api
    .get < { valido: true } > ( '/api/contas-pagamento/validar', { params: chave } )
    .then ( ( resposta ) => resposta.data )
};
