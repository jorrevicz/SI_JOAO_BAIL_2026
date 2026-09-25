import api from './api';

export interface Peca
{
  codPeca:   number;
  peca:      string;
  dtCriacao: string;
  dtEdicao:  string;
  codUser:   number | null;
  isActive:  boolean;
}

export interface CreatePecaInput
{
  peca:     string;
  isActive: boolean;
}

export type UpdatePecaInput = CreatePecaInput;

export const pecasService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Peca[] > ( '/api/pecas', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Peca > ( `/api/pecas/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreatePecaInput
  ) => api
    .post < Peca > ( '/api/pecas', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdatePecaInput
  ) => api
    .put < Peca > ( `/api/pecas/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/pecas/${ id }` ),
};
