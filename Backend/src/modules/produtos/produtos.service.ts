import type postgres from 'postgres';
import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { ProdutosRepository } from './produtos.repository';
import { CategoriasRepository } from '../categorias/categorias.repository';
import { ProdutoCategoriasRepository } from '../produto-categorias/produtoCategorias.repository';
import type { CreateProdutoInput, UpdateProdutoInput } from './produtos.schema';

export class ProdutosService
{
    constructor
    (
        private readonly repo:
            ProdutosRepository = new ProdutosRepository(),
        private readonly categoriasRepo:
            CategoriasRepository = new CategoriasRepository(),
        private readonly produtoCategoriasRepo:
            ProdutoCategoriasRepository = new ProdutoCategoriasRepository()
    )
    {};

    async ListProdutos
    (
        limit   = 50,
        afterId = 0,
        codCategoria?: number
    )
    {
        return this.repo.List ( limit, afterId, codCategoria );
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

    /**
     * Produto e seus vínculos de categoria nascem juntos ou não nascem: uma categoria
     * inexistente derruba a transação inteira, sem deixar produto órfão (RNF06).
     */
    async CreateProduto
    (
        data:    CreateProdutoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const produto = await this.repo.Create ( data, codUser, transaction );

            for ( const item of data.categorias )
            {
                await this.AssertCategoria ( item.codCategoria, transaction );

                await this.produtoCategoriasRepo.Create
                (
                    produto.codProd,
                    item.codCategoria,
                    transaction
                );
            }

            return produto;
        } );
    };

    /**
     * Reconciliação por diferença de conjuntos: como o vínculo não tem payload além das
     * duas FKs, não existe "atualizar item existente" — o par ou está na lista ou não.
     */
    async UpdateProduto
    (
        id:      number,
        data:    UpdateProdutoInput,
        codUser: number
    )
    {
        return WithTransaction ( async ( transaction ) =>
        {
            const atualizado = await this.repo.Update ( id, data, codUser, transaction );

            if ( !atualizado )
            {
                throw new AppError ( 'Produto não encontrado.', 404 );
            };

            const vinculosAtuais = await this.produtoCategoriasRepo.ListByProduto ( id, transaction );

            const codigosAtuais   = new Set ( vinculosAtuais.map ( ( vinculo ) => vinculo.codCategoria ) );
            const codigosDesejados = new Set ( data.categorias.map ( ( item ) => item.codCategoria ) );

            for ( const vinculo of vinculosAtuais )
            {
                if ( !codigosDesejados.has ( vinculo.codCategoria ) )
                {
                    await this.produtoCategoriasRepo.Delete ( id, vinculo.codCategoria, transaction );
                }
            }

            for ( const item of data.categorias )
            {
                if ( codigosAtuais.has ( item.codCategoria ) )
                {
                    continue;
                }

                await this.AssertCategoria ( item.codCategoria, transaction );

                await this.produtoCategoriasRepo.Create ( id, item.codCategoria, transaction );
            }

            return atualizado;
        } );
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

        // Os vínculos de categoria não sobrevivem ao produto: as FKs da associativa são
        // ON DELETE RESTRICT e uma linha apontando para produto inativo não tem uso.
        await WithTransaction ( async ( transaction ) =>
        {
            await this.produtoCategoriasRepo.DeleteByProduto ( id, transaction );
            await this.repo.Delete ( id, codUser, transaction );
        } );
    };

    private async AssertCategoria
    (
        codCategoria: number,
        transaction?: postgres.TransactionSql
    )
    {
        if ( !( await this.categoriasRepo.FindById ( codCategoria, transaction ) ) )
        {
            throw new AppError ( 'Categoria informada não existe.', 400 );
        }
    };
}
