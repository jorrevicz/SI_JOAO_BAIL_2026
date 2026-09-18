import { AppError } from '../../shared/errors/AppError';
import { ProdutoCategoriasRepository } from './produtoCategorias.repository';
import { ProdutosRepository } from '../produtos/produtos.repository';
import { CategoriasRepository } from '../categorias/categorias.repository';
import type { CreateProdutoCategoriaInput } from './produtoCategorias.schema';

export class ProdutoCategoriasService
{
    constructor
    (
        private readonly repo:           ProdutoCategoriasRepository = new ProdutoCategoriasRepository(),
        private readonly produtosRepo:   ProdutosRepository          = new ProdutosRepository(),
        private readonly categoriasRepo: CategoriasRepository        = new CategoriasRepository(),
    ) {}

    async ListVinculos ( limit = 50, afterId = 0, codProduto?: number )
    {
        return this.repo.List ( limit, afterId, codProduto );
    }

    async CreateVinculo ( data: CreateProdutoCategoriaInput )
    {
        if ( !( await this.produtosRepo.FindById ( data.codProduto ) ) )
        {
            throw new AppError ( 'Produto informado não existe.', 400 );
        }

        if ( !( await this.categoriasRepo.FindById ( data.codCategoria ) ) )
        {
            throw new AppError ( 'Categoria informada não existe.', 400 );
        }

        if ( await this.repo.FindPair ( data.codProduto, data.codCategoria ) )
        {
            throw new AppError ( 'Esta categoria já está vinculada ao produto.', 409 );
        }

        return this.repo.Create ( data.codProduto, data.codCategoria );
    }

    async DeleteVinculo ( codProduto: number, codCategoria: number )
    {
        const removido = await this.repo.Delete ( codProduto, codCategoria );

        if ( !removido )
        {
            throw new AppError ( 'Vínculo entre produto e categoria não encontrado.', 404 );
        }
    }
}
