import { AppError } from '../../shared/errors/AppError';
import { ProdutosRepository } from './produtos.repository';
import type { CreateProdutoInput, UpdateProdutoInput } from './produtos.schema';

export class ProdutosService
{
    constructor
    (
        private readonly repo:
            ProdutosRepository = new ProdutosRepository()
    )
    {};

    async ListProdutos
    (
        limit   = 50,
        afterId = 0
    )
    {
        return this.repo.List ( limit, afterId );
    };

    async FindProduto ( id: number )
    {
        const produto = await this.repo.FindById ( id );

        if ( !produto )
        {
            throw new AppError ( 'Produto não encontrado.', 404 );
        }

        return produto;
    };

    async CreateProduto
    (
        data:    CreateProdutoInput,
        codUser: number
    )
    {
        return this.repo.Create ( data, codUser );
    };

    async UpdateProduto
    (
        id:      number,
        data:    UpdateProdutoInput,
        codUser: number
    )
    {
        const atualizado = await this.repo.Update ( id, data, codUser );

        if ( !atualizado )
        {
            throw new AppError ( 'Produto não encontrado.', 404 );
        };

        return atualizado;
    };

    async DeleteProduto
    (
        id:      number,
        codUser: number
    )
    {
        const existe = await this.repo.FindById ( id );

        if ( !existe )
        {
            throw new AppError ( 'Produto não encontrado.', 404 );
        };

        if ( await this.repo.HasDependents ( id ) )
        {
            throw new AppError
            (
                'Não é possível excluir: produto vinculado a compras ou notas fiscais.',
                409
            );
        };

        await this.repo.Delete ( id, codUser );
    };
}
