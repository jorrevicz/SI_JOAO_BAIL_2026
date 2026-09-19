import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContasReceberService } from '../../modules/contas-receber/contas-receber.service';
import type { ContaAReceberId } from '../../modules/contas-receber/contas-receber.repository';

const ID_TESTE: ContaAReceberId = { numero: '00000001', modelo: '01', serie: '01', parcela: 1 };

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
        Update:                     vi.fn(),
        RegistrarPagamentoRecebido: vi.fn(),
        Cancelar:                   vi.fn(),
        Delete:                     vi.fn(),
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
            const conta = { ...ID_TESTE, codCliente: 1 };
            repo.FindById.mockResolvedValue ( conta );

            await expect ( service.FindConta ( ID_TESTE ) ).resolves.toEqual ( conta );
        });
    });

    describe ( 'CreateConta', () =>
    {
        const dados = { ...ID_TESTE, codCliente: 1, codFormaDePag: 2 } as never;

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

        it ( 'lança 409 quando já existe um documento com este número, modelo e série', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'delega ao repositório quando cliente e forma de pagamento existem e o documento é inédito', async () =>
        {
            const criada = { ...ID_TESTE, codCliente: 1 };
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( false );
            repo.Create.mockResolvedValue ( criada );

            const resultado = await service.CreateConta ( dados, 1 );

            expect ( repo.ExisteDocumento ).toHaveBeenCalledWith
            (
                { numero: ID_TESTE.numero, modelo: ID_TESTE.modelo, serie: ID_TESTE.serie }
            );
            expect ( repo.Create ).toHaveBeenCalledWith ( dados, 1 );
            expect ( resultado ).toEqual ( criada );
        });
    });

    describe ( 'UpdateConta', () =>
    {
        const dados = { ...ID_TESTE, codCliente: 1, codFormaDePag: 2, isActive: true } as never;

        it ( 'lança 400 quando o cliente informado não existe', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Update ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento informada não existe', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Update ).not.toHaveBeenCalled();
        });

        it ( 'lança 404 quando a conta não existe', async () =>
        {
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.Update.mockResolvedValue ( null );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'retorna a conta atualizada quando existe', async () =>
        {
            const atualizada = { ...ID_TESTE, codCliente: 1 };
            clientesRepo.FindById.mockResolvedValue ( { codCliente: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.Update.mockResolvedValue ( atualizada );

            await expect ( service.UpdateConta ( ID_TESTE, dados, 1 ) ).resolves.toEqual ( atualizada );
        });
    });

    describe ( 'RegistrarPagamentoRecebido', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect
            (
                service.RegistrarPagamentoRecebido ( ID_TESTE, '100.00', new Date(), new Date(), 1 )
            ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi baixada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date(), dtPagamento: new Date(), justificativaCancelamento: null } );

            await expect
            (
                service.RegistrarPagamentoRecebido ( ID_TESTE, '100.00', new Date(), new Date(), 1 )
            ).rejects.toMatchObject ( { status: 409 } );
        });

        it ( 'lança 409 quando a conta está cancelada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: null, dtBaixa: null, dtPagamento: null, justificativaCancelamento: 'Cancelada' } );

            await expect
            (
                service.RegistrarPagamentoRecebido ( ID_TESTE, '100.00', new Date(), new Date(), 1 )
            ).rejects.toMatchObject ( { status: 409 } );
        });

        it ( 'delega ao repositório quando a conta é elegível para baixa', async () =>
        {
            const dtBaixa = new Date ( '2026-01-15' );
            const dtPagamento = new Date ( '2026-01-15' );
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: null, dtBaixa: null, dtPagamento: null, justificativaCancelamento: null } );
            repo.RegistrarPagamentoRecebido.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa, dtPagamento } );

            const resultado = await service.RegistrarPagamentoRecebido ( ID_TESTE, '100.00', dtBaixa, dtPagamento, 1 );

            expect ( repo.RegistrarPagamentoRecebido ).toHaveBeenCalledWith ( ID_TESTE, '100.00', dtBaixa, dtPagamento, 1 );
            expect ( resultado ).toEqual ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa, dtPagamento } );
        });
    });

    describe ( 'CancelarConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi baixada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date(), dtPagamento: new Date() } );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject ( { status: 409 } );
        });

        it ( 'delega ao repositório quando a conta ainda não foi baixada', async () =>
        {
            const cancelada = { ...ID_TESTE, justificativaCancelamento: 'motivo' };
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: null, dtBaixa: null, dtPagamento: null } );
            repo.Cancelar.mockResolvedValue ( cancelada );

            await expect ( service.CancelarConta ( ID_TESTE, 'motivo', 1 ) ).resolves.toEqual ( cancelada );
        });
    });

    describe ( 'ValidarChave', () =>
    {
        const CHAVE = { numero: ID_TESTE.numero, modelo: ID_TESTE.modelo, serie: ID_TESTE.serie };

        it ( 'lança 409 quando já existe um documento com este número, modelo e série', async () =>
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

    describe ( 'DeleteConta', () =>
    {
        it ( 'lança 404 quando a conta não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.DeleteConta ( ID_TESTE, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'delega ao repositório quando a conta existe', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, codCliente: 1 } );

            await service.DeleteConta ( ID_TESTE, 1 );

            expect ( repo.Delete ).toHaveBeenCalledWith ( ID_TESTE, 1 );
        });
    });
});
