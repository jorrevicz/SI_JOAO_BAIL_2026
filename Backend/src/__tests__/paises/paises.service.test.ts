import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { PaisesService } from '../../modules/paises/paises.service';

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {

        List: vi.fn(),
        FindById: vi.fn(),
        Create: vi.fn(),
        Update: vi.fn(),
        Delete: vi.fn(),
        HasDependents: vi.fn(),
        ...over,
    };
}

describe ( 'PaisesService', () => {

    let repo: ReturnType < typeof MakeRepo >;
    let service: PaisesService;

    beforeEach
    (() => {

        repo = MakeRepo();
        service = new PaisesService ( repo as never );
    });

    it ( 'GetPais lança 404 quando não existe', async () => {

        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindPaises ( 99 ) ).rejects.toMatchObject
        ({
            status: 404
        });
    });

    it ( 'CreatePais delega ao repo com codUser', async () => {

        repo.Create.mockResolvedValue ( { codPais: 1 } );

        await service.CreatePais
        ({
            pais: 'Brasil',
            sigla: 'BR',
        }, 7 );
    });

    it ( 'UpdatePais lança 404 quando o registro não existe', async () => {

        repo.FindById.mockResolvedValue ( { codPais: 1 } );

        await expect ( service.UpdatePais ( 99, {} as never, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeletePais bloqueia quando há estados vinculados (RN002)', async () => {

        repo.FindById.mockResolvedValue ( { codPais: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeletePais ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeletePais faz soft delete sem dependentes', async () => {

        repo.FindById.mockResolvedValue ( { codPais: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeletePais ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
