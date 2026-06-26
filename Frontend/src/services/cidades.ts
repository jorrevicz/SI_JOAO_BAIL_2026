import api from './api';

export interface Cidade
{
  codCidade: number;
  codEstado: number;
  cidade: string;
  ddd: string | null;
  dtCriacao: string;
  dtEdicao: string;
  codUser: number | null;
  isActive: boolean;
}

export interface CreateCidadeInput
{
  codEstado: number;
  cidade: string;
  ddd?: string;
}

export type UpdateCidadeInput = CreateCidadeInput;

export const cidadesService = {
  listar: (
    codEstado?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < Cidade[] > ( '/api/cidades', { params: { ...( codEstado ? { codEstado } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Cidade > ( `/api/cidades/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateCidadeInput
  ) => api
    .post < Cidade > ( '/api/cidades', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id: number,
    dados: UpdateCidadeInput
  ) => api
    .put < Cidade > ( `/api/cidades/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/cidades/${ id }` ),
};
