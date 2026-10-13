import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContasPagamentoService } from '../../modules/contas-pagamento/contasPagamento.service';
import type { ContaAPagarId } from '../../modules/contas-pagamento/contasPagamento.repository';

const ID_TESTE: ContaAPagarId = { numero: '000000001', modelo: '01', serie: '01', codFornecedor: 1, parcela: 1 };

function MakeRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        List:            vi.fn(),
        FindById:        vi.fn(),
        ExisteDocumento: vi.fn(),
        Create:          vi.fn(),
        Cancelar:        vi.fn(),
        ...over,
    };
}

function MakeFornecedoresRepo
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

describe ( 'ContasPagamentoService', () =>
{
    let repo:             ReturnType < typeof MakeRepo >;
    let fornecedoresRepo: ReturnType < typeof MakeFornecedoresRepo >;
    let formasRepo:       ReturnType < typeof MakeFormasRepo >;
    let service:          ContasPagamentoService;

    beforeEach ( () =>
    {
        repo             = MakeRepo();
        fornecedoresRepo = MakeFornecedoresRepo();
        formasRepo       = MakeFormasRepo();
        service          = new ContasPagamentoService ( repo as never, fornecedoresRepo as never, formasRepo as never );
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

        it ( 'lança 400 quando o fornecedor informado não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento informada não existe', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 400 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando já existe um documento com esta chave (número, modelo, série, fornecedor e parcela)', async () =>
        {
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
            formasRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.CreateConta ( dados, 1 ) ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'delega ao repositório quando fornecedor e forma de pagamento existem e o documento é inédito', async () =>
        {
            const criada = ID_TESTE;
            fornecedoresRepo.FindById.mockResolvedValue ( { codForn: 1 } );
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

            await expect (
                service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 )
            ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 409 quando a conta já foi cancelada', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, justificativaCancelamento: 'Duplicada' } );

            await expect (
                service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 )
            ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'cancela a conta baixada (a conta nasce já baixada)', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, valorBaixa: '100.00', dtBaixa: new Date(), justificativaCancelamento: null } );
            repo.Cancelar.mockResolvedValue ( { ...ID_TESTE, justificativaCancelamento: 'Compra cancelada' } );

            const resultado = await service.CancelarConta ( ID_TESTE, 'Compra cancelada', 1 );

            expect ( repo.Cancelar ).toHaveBeenCalledWith ( ID_TESTE, 'Compra cancelada', 1 );
            expect ( resultado ).toMatchObject ( { ...ID_TESTE, justificativaCancelamento: 'Compra cancelada' } );
        });
    });

    describe ( 'ValidarChave', () =>
    {
        const CHAVE = ID_TESTE;

        it ( 'lança 409 quando já existe um documento com esta chave (número, modelo, série, fornecedor e parcela)', async () =>
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
