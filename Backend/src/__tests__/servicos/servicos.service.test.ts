import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { ServicosService } from '../../modules/servicos/servicos.service';

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

const SERVICO_TESTE = { servico: 'Formatação', valor: '150.00', codFuncionario: 1 };

describe ( 'ServicosService', () =>
{
    let repo: ReturnType < typeof MakeRepo >;
    let service: ServicosService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new ServicosService ( repo as never );
    });

    it ( 'FindServico lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindServico ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateServico delega ao repo com os dados e o codUser corretos', async () =>
    {
        repo.Create.mockResolvedValue ( { codServico: 1, ...SERVICO_TESTE } );

        const criado = await service.CreateServico ( SERVICO_TESTE, 7 );

        expect ( repo.Create ).toHaveBeenCalledWith ( SERVICO_TESTE, 7 );
        expect ( criado ).toMatchObject ( SERVICO_TESTE );
    });

    it ( 'UpdateServico lança 409 quando há execuções de OS vinculadas', async () =>
    {
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.UpdateServico ( 1, { ...SERVICO_TESTE, isActive: true }, 1 ) )
            .rejects.toMatchObject ( { status: 409 } );

        expect ( repo.Update ).not.toHaveBeenCalled();
    });

    it ( 'DeleteServico bloqueia quando há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codServico: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteServico ( 1, 1 ) ).rejects.toBeInstanceOf ( AppError );

        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteServico exclui quando não há dependentes, e uma nova busca deve falhar', async () =>
    {
        repo.FindById.mockResolvedValueOnce ( { codServico: 1 } );
        repo.HasDependents.mockResolvedValue ( false );

        await service.DeleteServico ( 1, 5 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 5 );

        repo.FindById.mockResolvedValueOnce ( null );
        await expect ( service.FindServico ( 1 ) ).rejects.toMatchObject ( { status: 404 } );
    });
});
