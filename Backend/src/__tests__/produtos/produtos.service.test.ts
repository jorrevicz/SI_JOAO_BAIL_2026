import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ProdutosService } from '../../modules/produtos/produtos.service';

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

describe ( 'ProdutosService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: ProdutosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new ProdutosService ( repo as never );
    });

    it ( 'FindProduto lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindProduto ( 99 ) ).rejects.toMatchObject
        ({
            status: 404
        });
    });

    it ( 'CreateProduto delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codProd: 1 } );

        await service.CreateProduto ( { produto: 'Teclado USB' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { produto: 'Teclado USB' }, 7 );
    });

    it ( 'UpdateProduto lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateProduto ( 99, { produto: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
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

    it ( 'DeleteProduto exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codProd: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteProduto ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
