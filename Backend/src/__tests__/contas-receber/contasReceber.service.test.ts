import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContasReceberService } from '../../modules/contas-receber/contasReceber.service';
import type { ContaAReceberId } from '../../modules/contas-receber/contasReceber.repository';

const ID_TESTE: ContaAReceberId = { numero: '000000001', modelo: '01', serie: '01', codCliente: 1, parcela: 1 };

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:                       vi.fn(),
        FindById:                   vi.fn(),
        ExisteDocumento:            vi.fn(),
        Create:                     vi.fn(),
        Cancelar:                   vi.fn(),
        ...over,
    };
}

function MakeClientesRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
        ...over,
    };
}

function MakeFormasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
        ...over,
    };
}

describe ( 'ContasReceberService', () =>
{
    let repo:         ReturnType < typeof MakeRepo >;
    let clientesRepo:  ReturnType < typeof MakeClientesRepo >;
    let formasRepo:    ReturnType < typeof MakeFormasRepo >;
    let service:       ContasReceberService;

    beforeEach ( () =>
    {
        repo         = MakeRepo();
        clientesRepo = MakeClientesRepo();
        formasRepo   = MakeFormasRepo();
        service      = new ContasReceberService ( repo as never, clientesRepo as never, formasRepo as never );
    });

    describe ( 'FindConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.FindConta ( ID_TESTE ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'retorna a conta quando existe', async () =>
        {
            const conta = ID_TESTE;
            repo.FindById.mockResolvedValue ( conta );

            await expect ( service.FindConta ( ID_TESTE ) ).resolves.toMatchObject ( conta );
        });
    });

    describe ( 'CreateConta', () =>
    {
        const dados = { ...ID_TESTE, codFormaDePag: 2 } as never;

        it ( 'lança 400 quando o cliente informado não existe', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento informada não existe', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando já existe um documento com esta chave (número, modelo, série, cliente e parcela)', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'delega ao repositório quando cliente e forma de pagamento existem e o documento é inédito', async () =>
        {
            const criada = ID_TESTE;
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( false );
            repo.Create.mockResolvedValue ( criada );

            const resultado = await service.CreateConta ( dados, 1 );

            expect ( repo.ExisteDocumento ).toHaveBeenCalledWith
            (
                ID_TESTE
            );
            expect ( repo.Create ).toHaveBeenCalledWith ( dados, 1 );
            expect ( resultado ).toMatchObject ( criada );
        });
    });

    describe ( 'CancelarConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi cancelada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, justificativaCancelamento: 'Duplicada' } );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject ( { status: 409 } );
        });

        it ( 'delega ao repositório e cancela a conta baixada (a conta nasce já baixada)', async () =>
        {
            const cancelada = { ...ID_TESTE, justificativaCancelamento: 'motivo' };
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date(), dtPagamento: new Date(), justificativaCancelamento: null } );
            repo.Cancelar.mockResolvedValue ( cancelada );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).resolves.toMatchObject ( cancelada );
        });
    });

    describe ( 'ValidarChave', () =>
    {
        const CHAVE = ID_TESTE;

        it ( 'lança 409 quando já existe um documento com esta chave (número, modelo, série, cliente e parcela)', async () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.ValidarChave ( CHAVE ) ).rejects.toMatchObject ( { status: 409 } );
        });

        it ( 'resolve quando o documento é inédito', async () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( false );

            await expect ( service.ValidarChave ( CHAVE ) ).resolves.toEqual ( { valido: true } );
            expect ( repo.ExisteDocumento ).toHaveBeenCalledWith ( CHAVE );
        });
    });

});
