import api from './api';

export interface Produto
{
  codProd:        number;
  codCategoria:   number | null;
  produto:        string;
  undProduto:     string | null;
  estoque:        number;
  pesoBruto:      string | null;
  pesoLiq:        string | null;
  saldoProd:      string;
  custoMedioProd: string;
  dtCriacao:      string;
  dtEdicao:       string;
  codUser:        number | null;
  isActive:       boolean;
}

export interface CreateProdutoInput
{
  produto:       string;
  codCategoria?: number;
  undProduto?:   string;
  estoque?:      number;
  custo?:        number;
  pesoBruto?:    number;
  pesoLiq?:      number;
  isActive:      boolean;
}

export interface UpdateProdutoInput
{
  produto:       string;
  codCategoria?: number;
  undProduto?:   string;
  pesoBruto?:    number;
  pesoLiq?:      number;
  isActive:      boolean;
}

export const produtosService = {
  listar: (
    params?: { limit?: number; after?: number; codCategoria?: number }
  ) => api
    .get < Produto[] > ( '/api/produtos', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Produto > ( `/api/produtos/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateProdutoInput
  ) => api
    .post < Produto > ( '/api/produtos', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateProdutoInput
  ) => api
    .put < Produto > ( `/api/produtos/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),


  remover: (
    id: number
  ) => api
    .delete ( `/api/produtos/${ id }` ),
};
