import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { CategoriasService } from '../../modules/categorias/categorias.service';

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

describe ( 'CategoriasService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: CategoriasService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new CategoriasService ( repo as never );
    });

    it ( 'FindCategoria lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindCategoria ( 99 ) ).rejects.toMatchObject
        ({
            status: 404
        });
    });

    it ( 'CreateCategoria delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codCategoria: 1 } );

        await service.CreateCategoria ( { categoria: 'Periféricos' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { categoria: 'Periféricos' }, 7 );
    });

    it ( 'UpdateCategoria lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateCategoria ( 99, { categoria: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteCategoria lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteCategoria ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteCategoria bloqueia quando há produtos vinculados (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCategoria: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteCategoria ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCategoria exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCategoria: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteCategoria ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
