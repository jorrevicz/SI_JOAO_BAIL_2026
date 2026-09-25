import api from './api';

export interface Cargo
{
  codCargo:  number;
  cargo:     string;
  dtCriacao: string;
  dtEdicao:  string;
  codUser:   number | null;
  isActive:  boolean;
}

export interface CreateCargoInput
{
  cargo:    string;
  isActive: boolean;
}

export type UpdateCargoInput = CreateCargoInput;

export const cargosService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Cargo[] > ( '/api/cargos', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Cargo > ( `/api/cargos/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateCargoInput
  ) => api
    .post < Cargo > ( '/api/cargos', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateCargoInput
  ) => api
    .put < Cargo > ( `/api/cargos/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/cargos/${ id }` ),
};
