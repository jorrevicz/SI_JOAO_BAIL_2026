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

// Campos que passaram a ser obrigatórios no cadastro de produto (unidade, pesos, estoque,
// custo e preço de venda).
const CAMPOS_PRODUTO = { undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, estoque: 0, custoProd: 0, precoVenda: 10 };

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
            expect ( parseFloat ( novo.precoVenda ) ).toBe ( 10 );

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
                { produto: 'Monitor Atualizado', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, precoVenda: 10, isActive: true, ...SEM_CATEGORIAS },
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
            expect ( achado?.isActive ).toBe ( false );

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Produtos" WHERE "codProd" = ${ novo.codProd }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'Create grava o custo inicial em custoProd e não no custo médio', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Notebook Custo', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, estoque: 10, custoProd: 2500, precoVenda: 3200, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( parseFloat ( novo.custoProd ) ).toBe ( 2500 );
            expect ( parseFloat ( novo.precoVenda ) ).toBe ( 3200 );
            expect ( parseFloat ( novo.custoMedioProd ) ).toBe ( 0 );
        });
    });

    it ( 'Update altera o preço de venda, mas não estoque nem custos (imutáveis na edição)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Notebook Teste', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, estoque: 10, custoProd: 2500, precoVenda: 3200, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( novo.estoque ).toBe ( 10 );

            const atualizado = await repoProdutos.Update
            (
                novo.codProd,
                { produto: 'Notebook Atualizado', undProduto: 'UN', pesoBruto: 1, pesoLiq: 0.9, precoVenda: 3500, isActive: true, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            expect ( atualizado?.estoque ).toBe ( 10 );
            expect ( parseFloat ( atualizado!.custoProd ) ).toBe ( 2500 );
            expect ( parseFloat ( atualizado!.custoMedioProd ) ).toBe ( 0 );
            expect ( parseFloat ( atualizado!.precoVenda ) ).toBe ( 3500 );
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

    // Fase 4 (Lote C-3) — o lançamento/estorno de compras lê o produto com trava de linha
    // e grava estoque/custos já calculados pelo service (o cálculo não fica no SQL).
    it ( 'FindByIdForUpdate devolve o produto ativo e null para o inativo', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const ativo = await repoProdutos.Create
            (
                { produto: 'Trava Ativo', ...CAMPOS_PRODUTO, estoque: 4, ...SEM_CATEGORIAS },
                1,
                transaction
            );
            const inativo = await repoProdutos.Create
            (
                { produto: 'Trava Inativo', ...CAMPOS_PRODUTO, ...SEM_CATEGORIAS },
                1,
                transaction
            );
            await repoProdutos.Delete ( inativo.codProd, 1, transaction );

            expect ( ( await repoProdutos.FindByIdForUpdate ( ativo.codProd, transaction ) )?.estoque ).toBe ( 4 );
            expect ( await repoProdutos.FindByIdForUpdate ( inativo.codProd, transaction ) ).toBeNull();
        });
    });

    it ( 'AtualizarEstoqueCusto grava estoque, custo médio e custo do produto', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repoProdutos.Create
            (
                { produto: 'Movimento Teste', ...CAMPOS_PRODUTO, estoque: 10, custoProd: 100, ...SEM_CATEGORIAS },
                1,
                transaction
            );

            const atualizado = await repoProdutos.AtualizarEstoqueCusto
            (
                novo.codProd,
                { estoque: 20, custoMedioProd: '110.123456', custoProd: '120.654321' },
                1,
                transaction
            );

            expect ( atualizado ).toMatchObject
            ({
                estoque:        20,
                custoMedioProd: '110.123456',
                custoProd:      '120.654321',
                produto:        'Movimento Teste',
            });
        });
    });
});
