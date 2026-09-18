import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCategoriaDeTeste } from '../helpers/fixtures';
import { ProdutosRepository } from '../../modules/produtos/produtos.repository';
import { ProdutoCategoriasRepository } from '../../modules/produto-categorias/produtoCategorias.repository';

const repoProdutos          = new ProdutosRepository();
const repoProdutoCategorias = new ProdutoCategoriasRepository();

// O repositório de Produtos não escreve mais categoria alguma: o vínculo é N:N e vive na
// associativa "ProdutoCategoria". `categorias` viaja no input só para satisfazer o tipo —
// quem o consome é o service.
const SEM_CATEGORIAS = { categorias: [] };

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
                { produto: 'Teclado USB Teste', undProduto: 'UN', ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( novo.codProd ).toBeDefined();
            expect ( parseFloat ( novo.saldoProd ) ).toBe ( 0 );

            const achado = await repoProdutos.FindById ( novo.codProd, transaction );
            expect ( achado?.produto ).toBe ( 'Teclado USB Teste' );
        });
    });

    it ( 'List filtra por categoria através da associativa', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCategoria = await criarCategoriaDeTeste ( transaction, 'CATEGORIA FILTRO' );

            const daCategoria = await repoProdutos.Create
            (
                { produto: 'Mouse Da Categoria', ...SEM_CATEGORIAS },
                1,
                transaction
            );
            const foraDaCategoria = await repoProdutos.Create
            (
                { produto: 'Monitor Fora Da Categoria', ...SEM_CATEGORIAS },
                1,
                transaction
            );

            await repoProdutoCategorias.Create ( daCategoria.codProd, codCategoria, transaction );

            const filtrados = await repoProdutos.List ( 100, 0, codCategoria, transaction );
            const codigos   = filtrados.map ( ( produto ) => produto.codProd );

            expect ( codigos ).toContain    ( daCategoria.codProd );
            expect ( codigos ).not.toContain ( foraDaCategoria.codProd );
        });
    });

    it ( 'Update altera os dados do produto dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Monitor Original', ...SEM_CATEGORIAS },
                1,
                transaction
            );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Monitor Atualizado', undProduto: 'UN', isActive: true, ...SEM_CATEGORIAS },
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
                { produto: 'Para Excluir', ...SEM_CATEGORIAS },
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
                { produto: 'Notebook Teste', estoque: 10, custo: 2500, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( novo.estoque ).toBe ( 10 );
            expect ( parseFloat ( novo.custoMedioProd ) ).toBe ( 2500 );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Notebook Atualizado', isActive: true, ...SEM_CATEGORIAS },
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
                { produto: 'Sem Dependentes', ...SEM_CATEGORIAS },
                1,
                transaction
            );

            const temDependentes = await repoProdutos.HasDependents ( novo.codProd, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
