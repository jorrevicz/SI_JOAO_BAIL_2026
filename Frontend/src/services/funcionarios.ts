import api from './api';

export interface Funcionario
{
  codFuncionario: number;
  codCidade:      number;
  codCargo:       number;
  funcionario:    string;
  funcFone:       string;
  dtCriacao:      string;
  dtEdicao:       string;
  codUser:        number | null;
  isActive:       boolean;
}

export interface CreateFuncionarioInput
{
  codCidade:   number;
  codCargo:    number;
  funcionario: string;
  funcFone:    string;
  isActive:    boolean;
}

export type UpdateFuncionarioInput = CreateFuncionarioInput;

export const funcionariosService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Funcionario[] > ( '/api/funcionarios', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Funcionario > ( `/api/funcionarios/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateFuncionarioInput
  ) => api
    .post < Funcionario > ( '/api/funcionarios', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateFuncionarioInput
  ) => api
    .put < Funcionario > ( `/api/funcionarios/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/funcionarios/${ id }` ),
};
