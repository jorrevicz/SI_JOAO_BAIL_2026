import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ParcelasService } from '../../modules/parcelas/parcelas.service';

function MakeParcelasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:     vi.fn(),
        FindById: vi.fn(),
        Create:   vi.fn(),
        Update:   vi.fn(),
        Delete:   vi.fn(),
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

const PAYLOAD_VALIDO        = { codCondDePag: 1, numParcela: 1, codFormaDePag: 1, percentual: 100, numDias: 30 };
const UPDATE_PAYLOAD_VALIDO = { codFormaDePag: 1, percentual: 100, numDias: 30, isActive: true };

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

        await expect ( service.FindParcela ( 1, 99 ) ).rejects.toMatchObject ( { status: 404 } );
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
        repo.List.mockResolvedValue ( [] );
        repo.Create.mockResolvedValue ( PAYLOAD_VALIDO );

        await service.CreateParcela ( PAYLOAD_VALIDO, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( PAYLOAD_VALIDO, 7 );
    });

    it ( 'CreateParcela lança 409 quando o número já existe na condição', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [ { numParcela: 1, numDias: 30 } ] );

        await expect
        (
            service.CreateParcela ( { ...PAYLOAD_VALIDO, numParcela: 1, numDias: 60 }, 1 )
        ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateParcela aceita número menor que o das parcelas já cadastradas (sem ordem de registro)', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [ { numParcela: 3, numDias: 90 } ] );
        repo.Create.mockResolvedValue ( {} );

        await service.CreateParcela ( { ...PAYLOAD_VALIDO, numParcela: 1, numDias: 30 }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { ...PAYLOAD_VALIDO, numParcela: 1, numDias: 30 }, 7 );
    });

    it ( 'CreateParcela lança 400 quando os dias não são maiores que os da parcela anterior', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [ { numParcela: 1, numDias: 30 } ] );

        await expect
        (
            service.CreateParcela ( { ...PAYLOAD_VALIDO, numParcela: 2, numDias: 30 }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        await expect
        (
            service.CreateParcela ( { ...PAYLOAD_VALIDO, numParcela: 2, numDias: 20 }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Create ).not.toHaveBeenCalled();
    });

    it ( 'CreateParcela lança 400 quando os dias não são menores que os da parcela seguinte', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [ { numParcela: 3, numDias: 60 } ] );

        await expect
        (
            service.CreateParcela ( { ...PAYLOAD_VALIDO, numParcela: 2, numDias: 60 }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );
    });

    it ( 'UpdateParcela lança 404 quando a parcela não existe', async () =>
    {
        condicoesRepo.FindById.mockResolvedValue ( { codCondDePag: 1 } );
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [] );
        repo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateParcela ( 1, 99, UPDATE_PAYLOAD_VALIDO, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateParcela lança 400 quando os dias não são maiores que os da parcela anterior', async () =>
    {
        formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.List.mockResolvedValue ( [ { numParcela: 1, numDias: 30 }, { numParcela: 2, numDias: 60 } ] );

        await expect
        (
            service.UpdateParcela ( 1, 2, { ...UPDATE_PAYLOAD_VALIDO, numDias: 30 }, 1 )
        ).rejects.toMatchObject ( { status: 400 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteParcela lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteParcela ( 1, 99, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteParcela deleta quando a parcela existe', async () =>
    {
        repo.FindById.mockResolvedValue ( { numParcela: 1 } );
        repo.Delete.mockResolvedValue ( { numParcela: 1 } );

        await service.DeleteParcela ( 1, 2, 7 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 2, 7 );
    });
});
