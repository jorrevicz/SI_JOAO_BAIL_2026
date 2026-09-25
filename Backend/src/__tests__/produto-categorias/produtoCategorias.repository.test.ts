import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCategoriaDeTeste, criarProdutoDeTeste } from '../helpers/fixtures';
import { ProdutoCategoriasRepository } from '../../modules/produto-categorias/produtoCategorias.repository';
import { CategoriasRepository } from '../../modules/categorias/categorias.repository';

const repoVinculos   = new ProdutoCategoriasRepository();
const repoCategorias = new CategoriasRepository();

describe ( 'ProdutoCategoriasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create vincula produto a categoria e ListByProduto recupera com o nome', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto   = await criarProdutoDeTeste   ( transaction, 'MOUSE VINCULADO' );
            const codCategoria = await criarCategoriaDeTeste ( transaction, 'PERIFERICOS TESTE' );

            await repoVinculos.Create ( codProduto, codCategoria, transaction );

            const vinculos = await repoVinculos.ListByProduto ( codProduto, transaction );

            expect ( vinculos ).toHaveLength ( 1 );
            expect ( vinculos[ 0 ].codCategoria ).toBe ( codCategoria );
            expect ( vinculos[ 0 ].categoria ).toBe ( 'PERIFERICOS TESTE' );
        });
    });

    it ( 'ListByProduto devolve todas as categorias do produto (N:N)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto  = await criarProdutoDeTeste   ( transaction, 'NOTEBOOK MULTI' );
            const primeira    = await criarCategoriaDeTeste ( transaction, 'NOTEBOOKS TESTE' );
            const segunda     = await criarCategoriaDeTeste ( transaction, 'PORTATEIS TESTE' );

            await repoVinculos.Create ( codProduto, primeira, transaction );
            await repoVinculos.Create ( codProduto, segunda,  transaction );

            const vinculos = await repoVinculos.ListByProduto ( codProduto, transaction );

            expect ( vinculos ).toHaveLength ( 2 );
            expect ( vinculos.map ( ( vinculo ) => vinculo.codCategoria ) )
                .toEqual ( [ primeira, segunda ].sort ( ( a, b ) => a - b ) );
        });
    });

    it ( 'Delete remove fisicamente apenas o par informado', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto = await criarProdutoDeTeste   ( transaction, 'SSD DOIS VINCULOS' );
            const manter     = await criarCategoriaDeTeste ( transaction, 'COMPONENTES TESTE' );
            const remover    = await criarCategoriaDeTeste ( transaction, 'ARMAZENAMENTO TESTE' );

            await repoVinculos.Create ( codProduto, manter,  transaction );
            await repoVinculos.Create ( codProduto, remover, transaction );

            await repoVinculos.Delete ( codProduto, remover, transaction );

            const vinculos = await repoVinculos.ListByProduto ( codProduto, transaction );

            expect ( vinculos ).toHaveLength ( 1 );
            expect ( vinculos[ 0 ].codCategoria ).toBe ( manter );
        });
    });

    it ( 'DeleteByProduto remove todos os vínculos do produto', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto = await criarProdutoDeTeste   ( transaction, 'CABO A REMOVER' );
            const primeira   = await criarCategoriaDeTeste ( transaction, 'CABOS TESTE' );
            const segunda    = await criarCategoriaDeTeste ( transaction, 'ACESSORIOS TESTE' );

            await repoVinculos.Create ( codProduto, primeira, transaction );
            await repoVinculos.Create ( codProduto, segunda,  transaction );

            await repoVinculos.DeleteByProduto ( codProduto, transaction );

            expect ( await repoVinculos.ListByProduto ( codProduto, transaction ) ).toHaveLength ( 0 );
        });
    });

    it ( 'FindPair localiza o vínculo existente e devolve null para o inexistente', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto   = await criarProdutoDeTeste   ( transaction, 'TECLADO PAR' );
            const codCategoria = await criarCategoriaDeTeste ( transaction, 'TECLADOS TESTE' );

            expect ( await repoVinculos.FindPair ( codProduto, codCategoria, transaction ) ).toBeNull();

            await repoVinculos.Create ( codProduto, codCategoria, transaction );

            expect ( await repoVinculos.FindPair ( codProduto, codCategoria, transaction ) )
                .toMatchObject ( { codProduto, codCategoria } );
        });
    });

    it ( 'CategoriasRepository.HasDependents bloqueia categoria vinculada a produto ativo (RN002)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codProduto   = await criarProdutoDeTeste   ( transaction, 'PRODUTO DEPENDENTE' );
            const codCategoria = await criarCategoriaDeTeste ( transaction, 'CATEGORIA OCUPADA' );

            expect ( await repoCategorias.HasDependents ( codCategoria, transaction ) ).toBe ( false );

            await repoVinculos.Create ( codProduto, codCategoria, transaction );

            expect ( await repoCategorias.HasDependents ( codCategoria, transaction ) ).toBe ( true );
        });
    });
});
