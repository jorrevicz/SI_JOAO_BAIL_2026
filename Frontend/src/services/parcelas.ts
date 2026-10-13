import api from './api';

export interface Parcela
{
  codCondDePag:  number;
  numParcela:    number;
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
  numParcela:    number;
  codFormaDePag: number;
  percentual:    number;
  numDias:       number;
  isActive:      boolean;
}

// A chave (codCondDePag, numParcela) vem da URL e não é alterável.
export type UpdateParcelaInput = Omit < CreateParcelaInput, 'codCondDePag' | 'numParcela' >;

export const parcelasService = {
  listar: (
    codCondDePag?: number,
    params?: { limit?: number; after?: number; afterCodCondDePag?: number }
  ) => api
    .get < Parcela[] > ( '/api/parcelas', { params: { ...( codCondDePag ? { codCondDePag } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    codCondDePag: number,
    numParcela: number
  ) => api
    .get < Parcela > ( `/api/parcelas/${ codCondDePag }/${ numParcela }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateParcelaInput
  ) => api
    .post < Parcela > ( '/api/parcelas', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    codCondDePag: number,
    numParcela: number,
    dados: UpdateParcelaInput
  ) => api
    .put < Parcela > ( `/api/parcelas/${ codCondDePag }/${ numParcela }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    codCondDePag: number,
    numParcela: number
  ) => api
    .delete ( `/api/parcelas/${ codCondDePag }/${ numParcela }` ),
};
