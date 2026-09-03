import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ParcelasService } from '../../modules/parcelas/parcelas.service';

function MakeParcelasRepo
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

function MakeCondicoesRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return { List: vi.fn(), FindById: vi.fn(), Create: vi.fn(), Update: vi.fn(), Delete: vi.fn(), HasDependents: vi.fn(), ...over };
}

function MakeFormasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return { List: vi.fn(), FindById: vi.fn(), Create: vi.fn(), Update: vi.fn(), Delete: vi.fn(), HasDependents: vi.fn(), ...over };
}

const PAYLOAD_VALIDO        = { codCondDePag: 1, codFormaDePag: 1, percentual: 100, numDias: 0 };
const UPDATE_PAYLOAD_VALIDO = { ...PAYLOAD_VALIDO, isActive: true };

describe ( 'ParcelasService', () =>
{
    let repo:          ReturnType < typeof MakeParcelasRepo >;
    let condicoesRepo: ReturnType < typeof MakeCondicoesRepo >;
    let formasRepo:    ReturnType < typeof MakeFormasRepo >;
    let service:       ParcelasService;

    beforeEach ( () =>
    {
        repo          = MakeParcelasRepo();
        condicoesRepo = MakeCondicoesRepo();
        formasRepo    = MakeFormasRepo();
        service       = new ParcelasService ( repo as never, condicoesRepo as never, formasRepo as never );
    });

    it ( 'FindParcela lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindParcela ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateParcela lança 400 quando a condição não existe', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateParcela ( PAYLOAD_VALIDO, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateParcela lança 400 quando a forma não existe', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( null );

        await expect
        (
            service.CreateParcela ( PAYLOAD_VALIDO, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateParcela delega ao repo quando condição e forma existem', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.Create.mockResolvedValue ( { codParcela: 10, ...PAYLOAD_VALIDO } );

        await service.CreateParcela ( PAYLOAD_VALIDO, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( PAYLOAD_VALIDO, 7 );
    });

    it ( 'UpdateParcela lança 404 quando a parcela não existe', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateParcela ( 99, UPDATE_PAYLOAD_VALIDO, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteParcela lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteParcela ( 99, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteParcela lança 409 quando há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codParcela: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteParcela ( 1, 1 ) ).rejects.toMatchObject ( { status: 409 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteParcela deleta quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codParcela: 1 } );
        repo.HasDependents.mockResolvedValue ( false );
        repo.Delete.mockResolvedValue ( { codParcela: 1 } );

        await service.DeleteParcela ( 1, 1 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 1 );
    });
});
