import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { CargosService } from '../../modules/cargos/cargos.service';

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

describe ( 'CargosService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: CargosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new CargosService ( repo as never );
    });

    it ( 'FindCargo lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindCargo ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateCargo delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codCargo: 1 } );

        await service.CreateCargo ( { cargo: 'Técnico' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { cargo: 'Técnico' }, 7 );
    });

    it ( 'UpdateCargo lança 409 quando há funcionários vinculados', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateCargo ( 1, { cargo: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCargo bloqueia quando há funcionários vinculados', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCargo: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteCargo ( 1, 1 ) ).rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCargo exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCargo: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteCargo ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
