import api from './api';

export interface Categoria
{
  codCategoria: number;
  categoria:    string;
  dtCriacao:    string;
  dtEdicao:     string;
  codUser:      number | null;
  isActive:     boolean;
}

export interface CreateCategoriaInput
{
  categoria: string;
  isActive: boolean;
}

export type UpdateCategoriaInput = CreateCategoriaInput;

export const categoriasService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Categoria[] > ( '/api/categorias', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Categoria > ( `/api/categorias/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateCategoriaInput
  ) => api
    .post < Categoria > ( '/api/categorias', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateCategoriaInput
  ) => api
    .put < Categoria > ( `/api/categorias/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/categorias/${ id }` ),
};
