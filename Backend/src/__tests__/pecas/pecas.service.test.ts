import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { PecasService } from '../../modules/pecas/pecas.service';

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

describe ( 'PecasService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: PecasService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new PecasService ( repo as never );
    });

    it ( 'FindPeca lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindPeca ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreatePeca delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codPeca: 1 } );

        await service.CreatePeca ( { peca: 'Placa-mãe' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { peca: 'Placa-mãe' }, 7 );
    });

    it ( 'UpdatePeca lança 409 quando há orçamentos/substituições vinculados', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdatePeca ( 1, { peca: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeletePeca bloqueia quando há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codPeca: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeletePeca ( 1, 1 ) ).rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeletePeca exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codPeca: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeletePeca ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
