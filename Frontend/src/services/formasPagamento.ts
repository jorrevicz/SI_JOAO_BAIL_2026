import api from './api';

export interface FormaPagamento
{
  codFormaDePag:    number;
  formaDePag:       string;
  prazoCompensacao: number | null;
  dtCriacao:        string;
  dtEdicao:         string;
  codUser:          number | null;
  isActive:         boolean;
}

export interface CreateFormaPagamentoInput
{
  formaDePag:       string;
  prazoCompensacao: number;
  isActive:         boolean;
}

export interface UpdateFormaPagamentoInput
{
  formaDePag: string;
  isActive:   boolean;
}

export const formasPagamentoService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < FormaPagamento[] > ( '/api/formas-pagamento', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < FormaPagamento > ( `/api/formas-pagamento/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateFormaPagamentoInput
  ) => api
    .post < FormaPagamento > ( '/api/formas-pagamento', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdateFormaPagamentoInput
  ) => api
    .put < FormaPagamento > ( `/api/formas-pagamento/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/formas-pagamento/${ id }` ),
};
