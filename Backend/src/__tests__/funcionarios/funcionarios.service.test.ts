import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { FuncionariosService } from '../../modules/funcionarios/funcionarios.service';

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

const FUNCIONARIO_TESTE = { codCidade: 1, codCargo: 1, funcionario: 'Ana Silva', funcFone: '19999999999' };

describe ( 'FuncionariosService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: FuncionariosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new FuncionariosService ( repo as never );
    });

    it ( 'FindFuncionario lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindFuncionario ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateFuncionario delega ao repo com os dados e o codUser corretos', async () =>
    {
        repo.Create.mockResolvedValue ( { codFuncionario: 1, ...FUNCIONARIO_TESTE } );

        const criado = await service.CreateFuncionario ( FUNCIONARIO_TESTE, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( FUNCIONARIO_TESTE, 7 );
        expect ( criado ).toMatchObject ( FUNCIONARIO_TESTE );
    });

    it ( 'UpdateFuncionario lança 409 quando há serviços vinculados', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateFuncionario ( 1, { ...FUNCIONARIO_TESTE, isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteFuncionario bloqueia quando há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codFuncionario: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteFuncionario ( 1, 1 ) ).rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteFuncionario exclui quando não há dependentes, e uma nova busca deve falhar', async () =>
    {
        repo.FindById.mockResolvedValueOnce ( { codFuncionario: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteFuncionario ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );

        repo.FindById.mockResolvedValueOnce ( null );
        await expect ( service.FindFuncionario ( 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });
});
