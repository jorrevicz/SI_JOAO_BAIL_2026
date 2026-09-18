import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ProdutosService } from '../../modules/produtos/produtos.service';

// A transação é neutralizada: o callback roda direto com um objeto vazio no lugar da
// TransactionSql, por isso toda asserção sobre os repositórios termina em `, {}`.
vi.mock ( '../../shared/transaction/withTransaction', () =>
({
    WithTransaction: ( fn: ( transaction: unknown ) => unknown ) => fn ( {} ),
}) );

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:          vi.fn(),
        FindById:      vi.fn(),
        Create:        vi.fn(),
        Update:        vi.fn(),
        Delete:        vi.fn(),
        HasDependents: vi.fn(),
        ...over,
    };
}

function MakeCategoriasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
        ...over,
    };
}

function MakeProdutoCategoriasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        ListByProduto:   vi.fn().mockResolvedValue ( [] ),
        Create:          vi.fn(),
        Delete:          vi.fn(),
        DeleteByProduto: vi.fn(),
        ...over,
    };
}

describe ( 'ProdutosService', () =>
{
    let repo:                 ReturnType < typeof MakeRepo >;
    let categoriasRepo:       ReturnType < typeof MakeCategoriasRepo >;
    let produtoCategoriasRepo: ReturnType < typeof MakeProdutoCategoriasRepo >;
    let service:              ProdutosService;

    beforeEach ( () =>
    {
        repo                  = MakeRepo();
        categoriasRepo        = MakeCategoriasRepo();
        produtoCategoriasRepo = MakeProdutoCategoriasRepo();
        service               = new ProdutosService
        (
            repo                  as never,
            categoriasRepo        as never,
            produtoCategoriasRepo as never
        );
    });

    it ( 'FindProduto lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindProduto ( 99 ) ).rejects.toMatchObject
        ({
            status: 404
        });
    });

    it ( 'CreateProduto delega ao repo com codUser dentro da transação', async () =>
    {
        repo.Create.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 3 } );

        await service.CreateProduto
        (
            { produto: 'Teclado USB', categorias: [ { codCategoria: 3 } ] },
            7
        );

        expect ( repo.Create ).toHaveBeenCalledWith
        (
            { produto: 'Teclado USB', categorias: [ { codCategoria: 3 } ] },
            7,
            {}
        );
    });

    it ( 'CreateProduto cria um vínculo por categoria do array', async () =>
    {
        repo.Create.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 3 } );

        await service.CreateProduto
        (
            {
                produto:    'Teclado USB',
                categorias: [ { codCategoria: 3 }, { codCategoria: 5 } ],
            },
            7
        );

        expect ( produtoCategoriasRepo.Create ).toHaveBeenCalledTimes ( 2 );
        expect ( produtoCategoriasRepo.Create ).toHaveBeenNthCalledWith ( 1, 1, 3, {} );
        expect ( produtoCategoriasRepo.Create ).toHaveBeenNthCalledWith ( 2, 1, 5, {} );
    });

    it ( 'CreateProduto lança 400 quando a categoria informada não existe', async () =>
    {
        repo.Create.mockResolvedValue ( { codProd: 1 } );
        categoriasRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateProduto
            (
                { produto: 'Teclado USB', categorias: [ { codCategoria: 999 } ] },
                7
            )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( produtoCategoriasRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'UpdateProduto lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateProduto
            (
                99,
                { produto: 'X', categorias: [ { codCategoria: 1 } ], isActive: true },
                1
            )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateProduto insere vínculo novo presente no array', async () =>
    {
        repo.Update.mockResolvedValue ( { codProd: 1 } );
        produtoCategoriasRepo.ListByProduto.mockResolvedValue ( [] );
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 4 } );

        await service.UpdateProduto
        (
            1,
            { produto: 'X', categorias: [ { codCategoria: 4 } ], isActive: true },
            1
        );

        expect ( produtoCategoriasRepo.Create ).toHaveBeenCalledWith ( 1, 4, {} );
        expect ( produtoCategoriasRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'UpdateProduto apaga vínculo ausente no array recebido', async () =>
    {
        repo.Update.mockResolvedValue ( { codProd: 1 } );
        produtoCategoriasRepo.ListByProduto.mockResolvedValue
        ([
            { codProduto: 1, codCategoria: 8, categoria: 'PERIFÉRICOS' },
        ]);
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 4 } );

        await service.UpdateProduto
        (
            1,
            { produto: 'X', categorias: [ { codCategoria: 4 } ], isActive: true },
            1
        );

        expect ( produtoCategoriasRepo.Delete ).toHaveBeenCalledWith ( 1, 8, {} );
        expect ( produtoCategoriasRepo.Create ).toHaveBeenCalledWith ( 1, 4, {} );
    });

    it ( 'UpdateProduto não mexe em vínculo que permaneceu no array', async () =>
    {
        repo.Update.mockResolvedValue ( { codProd: 1 } );
        produtoCategoriasRepo.ListByProduto.mockResolvedValue
        ([
            { codProduto: 1, codCategoria: 4, categoria: 'COMPONENTES' },
        ]);
        categoriasRepo.FindById.mockResolvedValue ( { codCategoria: 4 } );

        await service.UpdateProduto
        (
            1,
            { produto: 'X', categorias: [ { codCategoria: 4 } ], isActive: true },
            1
        );

        expect ( produtoCategoriasRepo.Create ).not.toHaveBeenCalled();
        expect ( produtoCategoriasRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteProduto lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteProduto ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteProduto bloqueia quando há dependentes (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codProd: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteProduto ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteProduto apaga os vínculos de categoria antes do soft delete', async () =>
    {
        repo.FindById.mockResolvedValue ( { codProd: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteProduto ( 1, 5 );

        expect ( produtoCategoriasRepo.DeleteByProduto ).toHaveBeenCalledWith ( 1, {} );
        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5, {} );
    });
});
