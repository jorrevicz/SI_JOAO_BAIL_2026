import api from './api';

// Item da lista de categorias enviada no corpo de criação/edição do produto.
// A leitura dos vínculos já gravados é feita por produtoCategoriasService.
export interface CategoriaProdutoInput
{
  codCategoria: number;
}

export interface Produto
{
  codProd:        number;
  produto:        string;
  undProduto:     string | null;
  estoque:        number;
  pesoBruto:      string | null;
  pesoLiq:        string | null;
  custoProd:      string;
  custoMedioProd: string;
  precoVenda:     string;
  dtCriacao:      string;
  dtEdicao:       string;
  codUser:        number | null;
  isActive:       boolean;
}

export interface CreateProdutoInput
{
  produto:    string;
  categorias: CategoriaProdutoInput[];
  undProduto: string;
  estoque:    number;
  custoProd:  number;
  precoVenda: number;
  pesoBruto:  number;
  pesoLiq:    number;
  isActive:   boolean;
}

export interface UpdateProdutoInput
{
  produto:    string;
  categorias: CategoriaProdutoInput[];
  undProduto: string;
  pesoBruto:  number;
  pesoLiq:    number;
  precoVenda: number;
  isActive:   boolean;
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
