import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { FornecedoresService } from '../../modules/fornecedores/fornecedores.service';

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

describe ( 'FornecedoresService', () =>
{
    let repo:    ReturnType < typeof MakeRepo >;
    let service: FornecedoresService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new FornecedoresService ( repo as never );
    });

    it ( 'FindFornecedor lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindFornecedor ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateFornecedor delega ao repo com codUser', async () =>
    {
        repo.Create.mockResolvedValue ( { codForn: 1 } );

        await service.CreateFornecedor ( { codCidade: 1, codCondDePag: 1, fornecedor: 'Tech Distribuidora' }, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { codCidade: 1, codCondDePag: 1, fornecedor: 'Tech Distribuidora' }, 7 );
    });

    it ( 'UpdateFornecedor lança 404 quando o registro não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect ( service.UpdateFornecedor ( 99, { codCidade: 1, codCondDePag: 1, fornecedor: 'X', isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteFornecedor lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteFornecedor ( 99, 1 ) )
            .rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'DeleteFornecedor bloqueia quando há dependentes (RN002)', async () =>
    {
        repo.FindById.mockResolvedValue ( { codForn: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteFornecedor ( 1, 1 ) )
            .rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteFornecedor exclui quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codForn: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteFornecedor ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );
    });
});
