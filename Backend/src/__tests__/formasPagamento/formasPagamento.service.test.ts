import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../shared/errors/AppError';
import { FormasPagamentoService } from '../../modules/formas-pagamento/formasPagamento.service';

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

describe ( 'FormasPagamentoService', () =>
{
    let repo:    ReturnType < typeof MakeRepo >;
    let service: FormasPagamentoService;

    beforeEach ( () =>
    {
        repo    = MakeRepo();
        service = new FormasPagamentoService ( repo as never );
    });

    it ( 'FindForma lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.FindForma ( 99 ) ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'CreateForma delega ao repo', async () =>
    {
        const nova = { codFormaDePag: 1, formaDePag: 'Boleto' };
        repo.Create.mockResolvedValue ( nova );

        const resultado = await service.CreateForma ( { formaDePag: 'Boleto' }, 1 );

        expect ( repo.Create ).toHaveBeenCalledWith ( { formaDePag: 'Boleto' }, 1 );
        expect ( resultado ).toEqual ( nova );
    });

    it ( 'UpdateForma lança 404 quando não existe', async () =>
    {
        repo.Update.mockResolvedValue ( null );

        await expect
        (
            service.UpdateForma ( 99, { formaDePag: 'X', isActive: true }, 1 )
        ).rejects.toMatchObject ( { status: 404 } );
    });

    it ( 'UpdateForma retorna atualizado quando existe', async () =>
    {
        const atualizada = { codFormaDePag: 1, formaDePag: 'PIX' };
        repo.Update.mockResolvedValue ( atualizada );

        const resultado = await service.UpdateForma ( 1, { formaDePag: 'PIX', isActive: true }, 1 );

        expect ( resultado ).toEqual ( atualizada );
    });

    it ( 'DeleteForma lança 404 quando não existe', async () =>
    {
        repo.FindById.mockResolvedValue ( null );

        await expect ( service.DeleteForma ( 99, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteForma lança 409 quando há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.HasDependents.mockResolvedValue ( true );

        await expect ( service.DeleteForma ( 1, 1 ) ).rejects.toMatchObject ( { status: 409 } );
        expect ( repo.Delete ).not.toHaveBeenCalled();
    });

    it ( 'DeleteForma deleta quando não há dependentes', async () =>
    {
        repo.FindById.mockResolvedValue ( { codFormaDePag: 1 } );
        repo.HasDependents.mockResolvedValue ( false );
        repo.Delete.mockResolvedValue ( { codFormaDePag: 1 } );

        await service.DeleteForma ( 1, 1 );

        expect ( repo.Delete ).toHaveBeenCalledWith ( 1, 1 );
    });
});
