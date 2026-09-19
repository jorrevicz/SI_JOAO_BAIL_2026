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

// Campos que passaram a ser obrigatórios no cadastro de produto (unidade, pesos, estoque e custo).
const CAMPOS_PRODUTO = { undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, estoque: 0, custo: 0 };

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
                { produto: 'Teclado USB Teste', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
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
                { produto: 'Mouse Da Categoria', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
                1,
                transaction
            );
            const foraDaCategoria = await repoProdutos.Create
            (
                { produto: 'Monitor Fora Da Categoria', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
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
                { produto: 'Monitor Original', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Monitor Atualizado', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, isActive: true, ...SEM_CATEGORIAS },
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
                { produto: 'Para Excluir', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            await repoProdutos.Delete ( novo.codProd, 1, transaction );

            const achado = await repoProdutos.FindById ( novo.codProd, transaction );
            expect ( achado ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Produtos" WHERE "codProd" = ${ novo.codProd }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'Update não altera estoque nem custoMedioProd (imutáveis na edição)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Notebook Teste', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, estoque: 10, custo: 2500, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( novo.estoque ).toBe ( 10 );
            expect ( parseFloat ( novo.custoMedioProd ) ).toBe ( 2500 );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Notebook Atualizado', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, isActive: true, ...SEM_CATEGORIAS },
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
                { produto: 'Sem Dependentes', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            const temDependentes = await repoProdutos.HasDependents ( novo.codProd, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
