import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { CidadesService } from '../../modules/cidades/cidades.service';

function MakeCidadesRepo
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

function MakeEstadosRepo
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

describe ( 'CidadesService', () => {

    let cidadesRepo: ReturnType < typeof MakeCidadesRepo >;
    let estadosRepo: ReturnType < typeof MakeEstadosRepo >;
    let service: CidadesService;

    beforeEach ( () => {

        cidadesRepo = MakeCidadesRepo();
        estadosRepo = MakeEstadosRepo();
        service     = new CidadesService ( cidadesRepo as never, estadosRepo as never );
    });

    it ( 'FindCidades lança 404 quando não existe', async () => {

        cidadesRepo.FindById.mockResolvedValue ( null );

        await expect ( service.FindCidades ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateCidade lança 400 quando o estado não existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateCidade ( { codEstado: 99, cidade: 'Inexistente' }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( cidadesRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateCidade delega ao repo quando o estado existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( { codEstado: 1 } );
        cidadesRepo.Create.mockResolvedValue ( { codCidade: 10 } );

        await service.CreateCidade ( { codEstado: 1, cidade: 'Campinas', ddd: '19' }, 7 );

        expect ( cidadesRepo.Create ).toHaveBeenCalledWith
        (
            { codEstado: 1, cidade: 'Campinas', ddd: '19' },
            7
        );
    });

    it ( 'UpdateCidade lança 400 quando o estado não existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.UpdateCidade ( 1, { codEstado: 99, cidade: 'X' }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );
    });

    it ( 'UpdateCidade lança 404 quando a cidade não existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( { codEstado: 1 } );
        cidadesRepo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateCidade ( 99, { codEstado: 1, cidade: 'Campinas' }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteCidade lança 404 quando não existe', async () => {

        cidadesRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.DeleteCidade ( 99, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteCidade bloqueia quando há clientes/fornecedores/transportadoras (RN002)', async () => {

        cidadesRepo.FindById.mockResolvedValue ( { codCidade: 1 } );
        cidadesRepo.HasDependents.mockResolvedValue ( true );

        await expect
        (
            service.DeleteCidade ( 1, 1 )
        ).rejects.toBeInstanceOf ( AppError );

        expect ( cidadesRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCidade faz soft delete sem dependentes', async () => {

        cidadesRepo.FindById.mockResolvedValue ( { codCidade: 1 } );
        cidadesRepo.HasDependents.mockResolvedValue ( false );

        await service.DeleteCidade ( 1, 5 );

        expect ( cidadesRepo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
