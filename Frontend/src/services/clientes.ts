import api from './api';

export type Genero = 'MASCULINO' | 'FEMININO' | 'OUTRO';

export interface Cliente
{
  codCliente:   number;
  codCidade:    number;
  codCondDePag: number | null;
  cliente:      string;
  tipoPessoa:   string | null;
  enderecoCl:   string | null;
  numeroCl:     number | null;
  bairroCl:     string | null;
  cepCl:        string | null;
  foneCl:       string | null;
  cpfCnpjCl:    string | null;
  inscEstCl:    string | null;
  foneFixo:     string | null;
  email:        string | null;
  apelido:      string | null;
  nomeFantasia: string | null;
  rg:           string | null;
  dtNascimento: string | null;
  dtFundacao:   string | null;
  genero:       Genero | null;
  dtCriacao:    string;
  dtEdicao:     string;
  codUser:      number | null;
  isActive:     boolean;
}

export interface CreateClienteInput
{
  codCidade:     number;
  cliente:       string;
  tipoPessoa:    string;
  codCondDePag?: number;
  enderecoCl?:   string;
  numeroCl?:     number;
  bairroCl?:     string;
  cepCl:         string;
  foneCl:        string;
  cpfCnpjCl:     string;
  inscEstCl:     string;
  foneFixo?:     string;
  email:         string;
  apelido?:      string;
  nomeFantasia?: string;
  rg?:           string;
  dtNascimento?: string;
  dtFundacao?:   string;
  genero?:       Genero;
  isActive:      boolean;
}

export type UpdateClienteInput = CreateClienteInput;

export const clientesService = {
  listar: (
    params?: { limit?: number; after?: number }
  ) => api
    .get < Cliente[] > ( '/api/clientes', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Cliente > ( `/api/clientes/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateClienteInput
  ) => api
    .post < Cliente > ( '/api/clientes', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateClienteInput
  ) => api
    .put < Cliente > ( `/api/clientes/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/clientes/${ id }` ),
};
