import api from './api';

export interface Servico
{
  codServico:     number;
  servico:        string;
  valor:          string;
  codFuncionario: number;
  dtCriacao:      string;
  dtEdicao:       string;
  codUser:        number | null;
  isActive:       boolean;
}

export interface CreateServicoInput
{
  servico:        string;
  valor:          string;
  codFuncionario: number;
  isActive:       boolean;
}

export type UpdateServicoInput = CreateServicoInput;

export const servicosService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Servico[] > ( '/api/servicos', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Servico > ( `/api/servicos/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateServicoInput
  ) => api
    .post < Servico > ( '/api/servicos', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateServicoInput
  ) => api
    .put < Servico > ( `/api/servicos/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/servicos/${ id }` ),
};
