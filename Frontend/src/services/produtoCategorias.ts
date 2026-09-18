import api from './api';

/**
 * Vínculo Produto ↔ Categoria. A relação é N:N, então o produto não carrega um código
 * de categoria: os vínculos vivem na associativa e são consultados por produto.
 * O nome da categoria vem resolvido pelo backend, para a tela não precisar cruzar listas.
 */
export interface ProdutoCategoria
{
  codProduto:   number;
  codCategoria: number;
  categoria:    string;
}

export interface CreateProdutoCategoriaInput
{
  codProduto:   number;
  codCategoria: number;
}

export const produtoCategoriasService = {
  listar: (
    codProduto?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < ProdutoCategoria[] > (
      '/api/produto-categorias',
      { params: { ...( codProduto ? { codProduto } : {} ), ...params } }
    )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateProdutoCategoriaInput
  ) => api
    .post < ProdutoCategoria > ( '/api/produto-categorias', dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    codProduto:   number,
    codCategoria: number
  ) => api
    .delete ( `/api/produto-categorias/${ codProduto }/${ codCategoria }` ),
};
