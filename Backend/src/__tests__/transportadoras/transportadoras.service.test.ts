import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { TransportadorasService } from '../../modules/transportadoras/transportadoras.service';

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

describe ( 'TransportadorasService', () =>
{
    let repo:    ReturnType < typeof MakeRepo >;
    let service: TransportadorasService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new TransportadorasService ( repo as never );
    });

    it ( 'FindTransportadora lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindTransportadora ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateTransportadora delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codTransp: 1 } );

        const dados = {
            codCidade: 1, transportadora: 'Rápida Transportes',
            tipoPessoa: 'JURIDICA' as const, cpfCnpjTransp: '11111111000101', inscEstTransp: '111111111111',
        };

        await service.CreateTransportadora ( dados, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( dados, 7 );
    });

    it ( 'UpdateTransportadora lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateTransportadora ( 99, {
            codCidade: 1, transportadora: 'X',
            tipoPessoa: 'JURIDICA', cpfCnpjTransp: '11111111000101', inscEstTransp: '111111111111',
            isActive: true,
        }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateTransportadora lança 409 quando há dependentes ativos (RN004 transversal)', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateTransportadora ( 1, {
            codCidade: 1, transportadora: 'X',
            tipoPessoa: 'JURIDICA', cpfCnpjTransp: '11111111000101', inscEstTransp: '111111111111',
            isActive: true,
        }, 1 ) ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteTransportadora lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteTransportadora ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteTransportadora bloqueia quando há dependentes (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codTransp: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteTransportadora ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteTransportadora exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codTransp: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteTransportadora ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
