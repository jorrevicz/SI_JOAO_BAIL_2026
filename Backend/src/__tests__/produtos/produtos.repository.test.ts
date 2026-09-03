import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { ProdutosRepository } from '../../modules/produtos/produtos.repository';
import { CategoriasRepository } from '../../modules/categorias/categorias.repository';

const repoProdutos    = new ProdutosRepository();
const repoCategorias  = new CategoriasRepository();

describe ( 'ProdutosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Teclado USB Teste', undProduto: 'UN' },
                1,
                transaction
            );

            expect ( novo.codProd ).toBeDefined();
            expect ( parseFloat ( novo.saldoProd ) ).toBe ( 0 );

            const achado = await repoProdutos.FindById ( novo.codProd, transaction );
            expect ( achado?.produto ).toBe ( 'Teclado USB Teste' );
        });
    });

    it ( 'Create vincula produto a categoria dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const categoria = await repoCategorias.Create
            (
                { categoria: 'Periféricos Teste' },
                1,
                transaction
            );

            const produto = await repoProdutos.Create
            (
                { produto: 'Mouse USB', codCategoria: categoria.codCategoria },
                1,
                transaction
            );

            expect ( produto.codCategoria ).toBe ( categoria.codCategoria );
        });
    });

    it ( 'Update altera os dados do produto dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Monitor Original' },
                1,
                transaction
            );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Monitor Atualizado', undProduto: 'UN', isActive: true },
                1,
                transaction
            );

            expect ( atualizado?.produto ).toBe ( 'Monitor Atualizado' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Para Excluir' },
                1,
                transaction
            );

            await repoProdutos.Delete ( novo.codProd, 1, transaction );

            const achado = await repoProdutos.FindById ( novo.codProd, transaction );
            expect ( achado ).toBeNull();
        });
    });

    it ( 'Update não altera estoque nem custoMedioProd (imutáveis na edição)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Notebook Teste', estoque: 10, custo: 2500 },
                1,
                transaction
            );

            expect ( novo.estoque ).toBe ( 10 );
            expect ( parseFloat ( novo.custoMedioProd ) ).toBe ( 2500 );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Notebook Atualizado', isActive: true },
                1,
                transaction
            );

            expect ( atualizado?.estoque ).toBe ( 10 );
            expect ( parseFloat ( atualizado!.custoMedioProd ) ).toBe ( 2500 );
            expect ( atualizado?.produto ).toBe ( 'Notebook Atualizado' );
        });
    });

    it ( 'HasDependents retorna false quando não há compras ou NF-e vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Sem Dependentes' },
                1,
                transaction
            );

            const temDependentes = await repoProdutos.HasDependents ( novo.codProd, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
