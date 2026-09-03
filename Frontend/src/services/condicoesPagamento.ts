import api from './api';

export interface CondicaoPagamento
{
  codCondDePag:    number;
  descricao:       string | null;
  juroCondPag:     string | null;
  multaCondPag:    string | null;
  descontoCondPag: string | null;
  dtCriacao:       string;
  dtEdicao:        string;
  codUser:         number | null;
  isActive:        boolean;
}

export interface ParcelaCondicaoInput
{
  codParcela?:   number;
  codFormaDePag: number;
  percentual:    number;
  numDias:       number;
  isActive:      boolean;
}

export interface CreateCondicaoPagamentoInput
{
  descricao:        string;
  juroCondPag?:     number;
  multaCondPag?:    number;
  descontoCondPag?: number;
  isActive:         boolean;
  parcelas:         ParcelaCondicaoInput[];
}

export interface UpdateCondicaoPagamentoInput
{
  descricao: string;
  isActive:  boolean;
  parcelas:  ParcelaCondicaoInput[];
}

export const condicoesPagamentoService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < CondicaoPagamento[] > ( '/api/condicoes-pagamento', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < CondicaoPagamento > ( `/api/condicoes-pagamento/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateCondicaoPagamentoInput
  ) => api
    .post < CondicaoPagamento > ( '/api/condicoes-pagamento', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdateCondicaoPagamentoInput
  ) => api
    .put < CondicaoPagamento > ( `/api/condicoes-pagamento/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/condicoes-pagamento/${ id }` ),
};
