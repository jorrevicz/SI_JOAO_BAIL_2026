import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { EstadosService } from '../../modules/estados/estados.service';

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

function MakePaisesRepo
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

describe ( 'EstadosService', () => {

    let estadosRepo: ReturnType < typeof MakeEstadosRepo >;
    let paisesRepo: ReturnType < typeof MakePaisesRepo >;
    let service: EstadosService;

    beforeEach ( () => {

        estadosRepo = MakeEstadosRepo();
        paisesRepo  = MakePaisesRepo();
        service     = new EstadosService ( estadosRepo as never, paisesRepo as never );
    });

    it ( 'FindEstados lança 404 quando não existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( null );

        await expect ( service.FindEstados ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateEstado lança 400 quando o país não existe', async () => {

        paisesRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateEstado ( { codPais: 99, uf: 'XX', estado: 'Inexistente' }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( estadosRepo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateEstado delega ao repo quando o país existe', async () => {

        paisesRepo.FindById.mockResolvedValue ( { codPais: 1 } );
        estadosRepo.Create.mockResolvedValue ( { codEstado: 10 } );

        await service.CreateEstado ( { codPais: 1, uf: 'SP', estado: 'São Paulo' }, 7 );

        expect ( estadosRepo.Create ).toHaveBeenCalledWith
        (
            { codPais: 1, uf: 'SP', estado: 'São Paulo' },
            7
        );
    });

    it ( 'UpdateEstado lança 400 quando o país não existe', async () => {

        paisesRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.UpdateEstado ( 1, { codPais: 99, uf: 'XX', estado: 'X' }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );
    });

    it ( 'UpdateEstado lança 404 quando o estado não existe', async () => {

        paisesRepo.FindById.mockResolvedValue ( { codPais: 1 } );
        estadosRepo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateEstado ( 99, { codPais: 1, uf: 'SP', estado: 'São Paulo' }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteEstado lança 404 quando não existe', async () => {

        estadosRepo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteEstado ( 99, 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteEstado bloqueia quando há cidades/veículos vinculados (RN002)', async () => {

        estadosRepo.FindById.mockResolvedValue ( { codEstado: 1 } );
        estadosRepo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteEstado ( 1, 1 ) ).rejects.toBeInstanceOf ( AppError );

        expect ( estadosRepo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteEstado faz soft delete sem dependentes', async () => {

        estadosRepo.FindById.mockResolvedValue ( { codEstado: 1 } );
        estadosRepo.HasDependents.mockResolvedValue ( false );

        await service.DeleteEstado ( 1, 5 );

        expect ( estadosRepo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
