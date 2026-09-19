import api from './api';

export interface Transportadora
{
  codTransp:      number;
  codCidade:      number;
  codVeiculo:     number | null;
  transportadora: string;
  nomeFantasia:   string | null;
  tipoPessoa:     string | null;
  enderecoTransp: string | null;
  cpfCnpjTransp:  string | null;
  inscEstTransp:  string | null;
  dtCriacao:      string;
  dtEdicao:       string;
  codUser:        number | null;
  isActive:       boolean;
}

export interface CreateTransportadoraInput
{
  codCidade:       number;
  transportadora:  string;
  codVeiculo?:     number;
  nomeFantasia?:   string;
  tipoPessoa:      'FISICA' | 'JURIDICA' | '';
  enderecoTransp?: string;
  cpfCnpjTransp:   string;
  inscEstTransp:   string;
  isActive:        boolean;
}

export type UpdateTransportadoraInput = CreateTransportadoraInput;

export const transportadorasService = {
  listar: (
    codForn?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < Transportadora[] > ( '/api/transportadoras', { params: { ...( codForn ? { codForn } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Transportadora > ( `/api/transportadoras/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateTransportadoraInput
  ) => api
    .post < Transportadora > ( '/api/transportadoras', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateTransportadoraInput
  ) => api
    .put < Transportadora > ( `/api/transportadoras/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/transportadoras/${ id }` ),
};
