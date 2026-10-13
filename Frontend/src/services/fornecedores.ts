import api from './api';
import { type Genero } from './clientes';

export interface Fornecedor
{
  codForn:        number;
  codCidade:      number;
  codCondDePag:   number;
  fornecedor:     string;
  nomeFantasia:   string | null;
  tipoPessoa:     string | null;
  enderecoForn:   string | null;
  bairroForn:     string | null;
  cepForn:        string | null;
  foneForn:       string | null;
  cpfCnpjForn:    string | null;
  inscEstSubTrib: string | null;
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

export interface CreateFornecedorInput
{
  codCidade:       number;
  codCondDePag:    number;
  fornecedor:      string;
  nomeFantasia?:   string;
  tipoPessoa:      'FISICA' | 'JURIDICA' | '';
  enderecoForn?:   string;
  bairroForn?:     string;
  cepForn:         string;
  foneForn:        string;
  cpfCnpjForn:     string;
  inscEstSubTrib:  string;
  foneFixo?:       string;
  email:           string;
  apelido?:        string;
  rg?:             string;
  dtNascimento?:   string;
  dtFundacao?:     string;
  genero?:         Genero;
  isActive:        boolean;
}

export type UpdateFornecedorInput = CreateFornecedorInput;

export const fornecedoresService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Fornecedor[] > ( '/api/fornecedores', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Fornecedor > ( `/api/fornecedores/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateFornecedorInput
  ) => api
    .post < Fornecedor > ( '/api/fornecedores', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateFornecedorInput
  ) => api
    .put < Fornecedor > ( `/api/fornecedores/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/fornecedores/${ id }` ),
};
