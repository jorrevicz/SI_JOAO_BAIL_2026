import api from './api';

export interface Pais
{
  codPais: number;
  pais: string;
  sigla: string;
  ddi: string | null;
  moeda: string | null;
  dtCriacao: string;
  dtEdicao: string;
  codUser: number | null;
  isActive: boolean;
}

export interface CreatePaisInput
{
  pais: string;
  sigla: string;
  ddi?: string;
  moeda?: string;
}

export type UpdatePaisInput = CreatePaisInput;

export const paisesService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Pais[] > ( '/api/paises', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Pais > ( `/api/paises/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreatePaisInput
  ) => api
    .post < Pais > ( '/api/paises', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdatePaisInput
  ) => api
    .put < Pais > ( `/api/paises/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/paises/${ id }` ),
};
