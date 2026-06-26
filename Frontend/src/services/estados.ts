import api from './api';

export interface Estado
{
  codEstado: number;
  codPais: number;
  uf: string;
  estado: string;
  dtCriacao: string;
  dtEdicao: string;
  codUser: number | null;
  isActive: boolean;
}

export interface CreateEstadoInput
{
  codPais: number;
  uf: string;
  estado: string;
}

export type UpdateEstadoInput = CreateEstadoInput;

export const estadosService = {
  listar: (
    codPais?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < Estado[] > ( '/api/estados', { params: { ...( codPais ? { codPais } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Estado > ( `/api/estados/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateEstadoInput
  ) => api
    .post < Estado > ( '/api/estados', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdateEstadoInput
  ) => api
    .put < Estado > ( `/api/estados/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/estados/${ id }` ),
};
