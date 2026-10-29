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
        ListAtivasPorDocumento: vi.fn(),
        Cancelar:        vi.fn(),
        ...over,
    };
}

function MakeComprasRepo
(
    over: Partial < Record < string, ReturnType < typeof vi.fn > > > = {}
)
{
    return {
        FindById: vi.fn(),
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
    let comprasRepo:      ReturnType < typeof MakeComprasRepo >;
    let service:          ContasPagamentoService;

    beforeEach ( () =>
    {
        repo             = MakeRepo();
        fornecedoresRepo = MakeFornecedoresRepo();
        formasRepo       = MakeFormasRepo();
        comprasRepo      = MakeComprasRepo();
        service          = new ContasPagamentoService ( repo as never, fornecedoresRepo as never, formasRepo as never, comprasRepo as never );
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

    describe ( 'CancelarContasDaCompra', () =>
    {
        const COMPRA_ID = { numero: '000000001', modelo: '01', serie: '01', codForn: 1 };
        const DOCUMENTO = { numero: '000000001', modelo: '01', serie: '01', codFornecedor: 1 };
        const TRANSACAO = {} as never;

        it ( 'lança 404 quando a compra não existe', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( null );

            await expect (
                service.CancelarContasDaCompra ( COMPRA_ID, 'Compra cancelada', 1, TRANSACAO )
            ).rejects.toMatchObject ( { status: 404 } );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando a compra relacionada ainda está ativa', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( { ...COMPRA_ID, isActive: true } );

            await expect (
                service.CancelarContasDaCompra ( COMPRA_ID, 'Compra cancelada', 1, TRANSACAO )
            ).rejects.toMatchObject
            (
                { status: 409, message: 'As contas a pagar só podem ser excluídas a partir de uma compra cancelada.' }
            );
            expect ( repo.ListAtivasPorDocumento ).not.toHaveBeenCalled();
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'exclui cada parcela do documento pela chave primária completa quando a compra está desativada', async () =>
        {
            const VALORES = { valor: '50.00', juro: '0.00', multa: '0.00', desconto: '0.00' };
            comprasRepo.FindById.mockResolvedValue ( { ...COMPRA_ID, isActive: false } );
            repo.ListAtivasPorDocumento.mockResolvedValue
            ([
                { ...DOCUMENTO, parcela: 1, ...VALORES, justificativaCancelamento: null },
                { ...DOCUMENTO, parcela: 2, ...VALORES, justificativaCancelamento: null },
            ]);
            repo.Cancelar.mockImplementation ( async ( id ) => ( { ...id, ...VALORES, justificativaCancelamento: 'Compra cancelada' } ) );

            const resultado = await service.CancelarContasDaCompra ( COMPRA_ID, 'Compra cancelada', 1, TRANSACAO );

            expect ( comprasRepo.FindById ).toHaveBeenCalledWith ( COMPRA_ID, TRANSACAO );
            expect ( repo.ListAtivasPorDocumento ).toHaveBeenCalledWith ( DOCUMENTO, TRANSACAO );
            expect ( repo.Cancelar ).toHaveBeenNthCalledWith ( 1, { ...DOCUMENTO, parcela: 1 }, 'Compra cancelada', 1, TRANSACAO );
            expect ( repo.Cancelar ).toHaveBeenNthCalledWith ( 2, { ...DOCUMENTO, parcela: 2 }, 'Compra cancelada', 1, TRANSACAO );
            expect ( resultado ).toHaveLength ( 2 );
            expect ( resultado[ 0 ] ).toMatchObject ( { parcela: 1, vlrTotal: '50.00' } );
        });

        it ( 'não faz nada quando a compra cancelada não tem contas a pagar', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( { ...COMPRA_ID, isActive: false } );
            repo.ListAtivasPorDocumento.mockResolvedValue ( [] );

            await expect ( service.CancelarContasDaCompra ( COMPRA_ID, 'Compra cancelada', 1, TRANSACAO ) ).resolves.toEqual ( [] );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
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
