import api from './api';

export interface Parcela
{
  codParcela:    number;
  codCondDePag:  number;
  codFormaDePag: number;
  percentual:    string;
  numDias:       number;
  dtCriacao:     string;
  dtEdicao:      string;
  codUser:       number | null;
  isActive:      boolean;
}

export interface CreateParcelaInput
{
  codCondDePag:  number;
  codFormaDePag: number;
  percentual:    number;
  numDias:       number;
  isActive:      boolean;
}

export type UpdateParcelaInput = CreateParcelaInput;

export const parcelasService = {
  listar: (
    codCondDePag?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < Parcela[] > ( '/api/parcelas', { params: { ...( codCondDePag ? { codCondDePag } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Parcela > ( `/api/parcelas/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateParcelaInput
  ) => api
    .post < Parcela > ( '/api/parcelas', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdateParcelaInput
  ) => api
    .put < Parcela > ( `/api/parcelas/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/parcelas/${ id }` ),
};
