import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ClientesService } from '../../modules/clientes/clientes.service';

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

describe ( 'ClientesService', () =>
{
    let repo:    ReturnType < typeof MakeRepo >;
    let service: ClientesService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new ClientesService ( repo as never );
    });

    it ( 'FindCliente lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindCliente ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateCliente delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codCliente: 1 } );

        const dados = {
            codCidade: 1, cliente: 'João da Silva',
            tipoPessoa: 'FISICA' as const, cepCl: '20511120', foneCl: '5521988887777',
        };

        await service.CreateCliente ( dados, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( dados, 7 );
    });

    it ( 'UpdateCliente lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateCliente ( 99, {
            codCidade: 1, cliente: 'X',
            tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
            isActive: true,
        }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateCliente lança 409 quando há dependentes ativos (RN004 transversal)', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateCliente ( 1, {
            codCidade: 1, cliente: 'X',
            tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
            isActive: true,
        }, 1 ) ).rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCliente lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteCliente ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteCliente bloqueia quando há dependentes (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCliente: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteCliente ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteCliente exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codCliente: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteCliente ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
