import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { VeiculosService } from '../../modules/veiculos/veiculos.service';

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

describe ( 'VeiculosService', () =>
{
    let repo:    ReturnType < typeof MakeRepo >;
    let service: VeiculosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new VeiculosService ( repo as never );
    });

    it ( 'FindVeiculo lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindVeiculo ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateVeiculo delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codVeiculo: 1 } );

        const dados = { placaVeiculo: 'ABC1234', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000001' };

        await service.CreateVeiculo ( dados, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( dados, 7 );
    });

    it ( 'UpdateVeiculo lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateVeiculo (
            99,
            { placaVeiculo: 'XYZ9999', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000001', isActive: true },
            1
        ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateVeiculo lança 409 quando há dependentes ativos (RN004 transversal)', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateVeiculo (
            1,
            { placaVeiculo: 'XYZ9999', modeloVeiculo: 'Gol', marca: 'VW', codAntt: '00000001', isActive: true },
            1
        ) ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteVeiculo lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteVeiculo ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteVeiculo bloqueia quando há dependentes (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codVeiculo: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteVeiculo ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteVeiculo exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codVeiculo: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteVeiculo ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
