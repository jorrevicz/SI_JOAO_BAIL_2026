import api from './api';

export interface Procedimento
{
  codProcedimento: number;
  procedimento:    string;
  dtCriacao:       string;
  dtEdicao:        string;
  codUser:         number | null;
  isActive:        boolean;
}

export interface CreateProcedimentoInput
{
  procedimento: string;
  isActive:     boolean;
}

export type UpdateProcedimentoInput = CreateProcedimentoInput;

export const procedimentosService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Procedimento[] > ( '/api/procedimentos', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Procedimento > ( `/api/procedimentos/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateProcedimentoInput
  ) => api
    .post < Procedimento > ( '/api/procedimentos', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateProcedimentoInput
  ) => api
    .put < Procedimento > ( `/api/procedimentos/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/procedimentos/${ id }` ),
};
