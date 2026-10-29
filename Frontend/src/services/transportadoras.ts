import api from './api';
import { type Genero } from './clientes';

export interface Transportadora
{
  codTransp:      number;
  codCidade:      number;
  codVeiculo:     number | null;
  transportadora: string;
  nomeFantasia:   string | null;
  tipoPessoa:     string | null;
  enderecoTransp: string | null;
  numeroTransp:   number | null;
  cpfCnpjTransp:  string | null;
  inscEstTransp:  string | null;
  bairroTransp:   string | null;
  cepTransp:      string | null;
  foneTransp:     string | null;
  foneFixo:       string | null;
  email:          string | null;
  apelido:        string | null;
  rg:             string | null;
  dtNascimento:   string | null;
  dtFundacao:     string | null;
  genero:         Genero | null;
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
  numeroTransp?:   number;
  cpfCnpjTransp:   string;
  inscEstTransp?:  string;
  bairroTransp?:   string;
  cepTransp:       string;
  foneTransp:      string;
  foneFixo?:       string;
  email:           string;
  apelido?:        string;
  rg?:             string;
  dtNascimento?:   string;
  dtFundacao?:     string;
  genero?:         Genero;
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
