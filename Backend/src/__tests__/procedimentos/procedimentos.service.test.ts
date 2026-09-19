import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ProcedimentosService } from '../../modules/procedimentos/procedimentos.service';

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

describe ( 'ProcedimentosService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: ProcedimentosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new ProcedimentosService ( repo as never );
    });

    it ( 'FindProcedimento lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindProcedimento ( 99 ) ).rejects.toMatchObject
        ({
            status: 404
        });
    });

    it ( 'CreateProcedimento delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codProcedimento: 1 } );

        await service.CreateProcedimento ( { procedimento: 'Há lacres?' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { procedimento: 'Há lacres?' }, 7 );
    });

    it ( 'UpdateProcedimento lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateProcedimento ( 99, { procedimento: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateProcedimento lança 409 quando há checagens vinculadas (RN004 transversal)', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateProcedimento ( 1, { procedimento: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteProcedimento lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteProcedimento ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteProcedimento bloqueia quando há checagens vinculadas (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteProcedimento ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteProcedimento exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codProcedimento: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteProcedimento ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
