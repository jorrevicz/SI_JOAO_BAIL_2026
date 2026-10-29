import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotasFiscaisService } from '../../modules/notas-fiscais/notasFiscais.service';
import type { NotaFiscalId } from '../../modules/notas-fiscais/notasFiscais.repository';
import type { GerarNotaFiscalInput } from '../../modules/notas-fiscais/notasFiscais.schema';

// A transação é neutralizada: o callback roda direto com um objeto vazio no lugar da
// TransactionSql, por isso as asserções sobre os repositórios terminam em `, {}`.
vi.mock ( '../../shared/transaction/withTransaction', () =>
({
    WithTransaction: ( fn: ( transaction: unknown ) => unknown ) => fn ( {} ),
}) );

// A NF-e tem as mesmas chaves da compra; no repositório de compras o fornecedor é `codForn`.
const NOTA_ID:   NotaFiscalId = { numero: '000000101', modelo: '55', serie: '01', codFornecedor: 3 };
const COMPRA_ID               = { numero: '000000101', modelo: '55', serie: '01', codForn: 3 };

const COMPRA_LANCADA   = { ...COMPRA_ID, frete: '60.00', seguro: '20.00', despesas: '20.00', justificativaCancelamento: null };
const COMPRA_CANCELADA = { ...COMPRA_LANCADA, justificativaCancelamento: 'Nota devolvida' };

const ITENS_COMPRA =
[
    { codProduto: 7, produto: 'MOUSE',   undProduto: 'UN', quantidade: 5,  valorUnitario: '380.00', desconto: '0.00'   },
    { codProduto: 8, produto: 'TECLADO', undProduto: 'UN', quantidade: 10, valorUnitario: '210.00', desconto: '100.00' },
];

const TRIBUTACAO =
[
    { codProduto: 7, cfop: '1102', csosn: '102' as const, aliqIcms: '18.00', aliqIpi: '10.00' },
    { codProduto: 8, cfop: '1102', csosn: '102' as const, aliqIcms: '12.00', aliqIpi: '0.00'  },
];

const NOVA_NOTA: GerarNotaFiscalInput =
{
    ...NOTA_ID,
    chaveAcessoNfe: '4'.repeat ( 44 ),
    dhEmiNfe:       new Date ( '2026-09-20T10:00:00Z' ),
    dhSaiNfe:       null,
    fretePorConta:  'Emitente',
    infoCompl:      null,
    itens:          TRIBUTACAO,
};

const NOTA_ATIVA     = { ...NOTA_ID, frete: '60.00', seguro: '20.00', despesas: '20.00', fornecedor: 'FORNECEDOR', isActive: true, justificativaCancelamento: null };
const NOTA_CANCELADA = { ...NOTA_ATIVA, isActive: false, justificativaCancelamento: 'Chave errada' };

const ITENS_NOTA = ITENS_COMPRA.map ( ( item, indice ) => ( { ...item, ...TRIBUTACAO[ indice ] } ) );

type MockRepo = Record < string, ReturnType < typeof vi.fn > >;

function MakeMock ( metodos: string[] ): MockRepo
{
    const mock: MockRepo = {};

    for ( const metodo of metodos )
    {
        mock[ metodo ] = vi.fn();
    }

    return mock;
}

describe ( 'NotasFiscaisService', () =>
{
    let repo:        MockRepo;
    let comprasRepo: MockRepo;
    let service:     NotasFiscaisService;

    beforeEach ( () =>
    {
        repo        = MakeMock ( [ 'List', 'FindById', 'ListItens', 'Create', 'CreateItem', 'Cancelar' ] );
        comprasRepo = MakeMock ( [ 'FindById', 'ListItens' ] );

        comprasRepo.FindById.mockResolvedValue  ( COMPRA_LANCADA );
        comprasRepo.ListItens.mockResolvedValue ( ITENS_COMPRA );
        repo.FindById.mockResolvedValue  ( null );
        repo.ListItens.mockResolvedValue ( ITENS_NOTA );

        service = new NotasFiscaisService ( repo as never, comprasRepo as never );
    });

    describe ( 'ListNotasFiscais', () =>
    {
        it ( 'delega ao repo com cursor sobre a chave composta e acrescenta o total calculado', async () =>
        {
            repo.List.mockResolvedValue ( [ NOTA_ATIVA ] );

            const notas = await service.ListNotasFiscais ( 20, NOTA_ID, { codFornecedor: 3 } );

            expect ( repo.List ).toHaveBeenCalledWith ( 20, NOTA_ID, { codFornecedor: 3 } );
            expect ( repo.ListItens ).toHaveBeenCalledWith ( NOTA_ID );
            expect ( notas[ 0 ] ).toMatchObject ( { ...NOTA_ID, vlrTotalNota: '4190.00' } );
        });
    });

    describe ( 'FindNotaFiscal', () =>
    {
        it ( 'lança 404 quando a nota não existe', async () =>
        {
            await expect ( service.FindNotaFiscal ( NOTA_ID ) ).rejects.toMatchObject
            (
                { status: 404, message: 'Nota fiscal não encontrada.' }
            );
        });

        it ( 'devolve o cabeçalho com os itens tributados e os totais calculados', async () =>
        {
            repo.FindById.mockResolvedValue ( NOTA_ATIVA );

            const nota = await service.FindNotaFiscal ( NOTA_ID );

            expect ( repo.FindById ).toHaveBeenCalledWith ( NOTA_ID );
            expect ( nota ).toMatchObject
            ({
                ...NOTA_ID,
                totalProdutos: '3900.00',
                totalIcms:     '582.00',
                totalIpi:      '190.00',
                vlrTotalNota:  '4190.00',
            });
            expect ( nota.itens[ 0 ] ).toMatchObject
            ({
                codProduto: 7,
                produto:    'MOUSE',
                cfop:       '1102',
                baseIcms:   '1900.00',
                valorIcms:  '342.00',
                valorIpi:   '190.00',
            });
        });
    });

    describe ( 'CalcularNotaFiscal', () =>
    {
        it ( 'calcula os impostos com quantidade, valor e desconto vindos da compra', async () =>
        {
            const calculo = await service.CalcularNotaFiscal ( { ...NOTA_ID, itens: TRIBUTACAO } );

            expect ( comprasRepo.FindById ).toHaveBeenCalledWith  ( COMPRA_ID );
            expect ( comprasRepo.ListItens ).toHaveBeenCalledWith ( COMPRA_ID );
            expect ( calculo ).toMatchObject ( { totalIcms: '582.00', vlrTotalNota: '4190.00' } );
            expect ( calculo.itens[ 1 ] ).toMatchObject ( { codProduto: 8, produto: 'TECLADO', quantidade: 10, valorProduto: '2000.00' } );
        });

        it ( 'lança 404 quando a compra não existe', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CalcularNotaFiscal ( { ...NOTA_ID, itens: TRIBUTACAO } ) ).rejects.toMatchObject
            (
                { status: 404, message: 'Compra não encontrada.' }
            );
        });

        it ( 'lança 400 quando falta a tributação de um produto da compra', async () =>
        {
            await expect ( service.CalcularNotaFiscal ( { ...NOTA_ID, itens: [ TRIBUTACAO[ 0 ] ] } ) ).rejects.toMatchObject
            (
                { status: 400, message: 'Informe a tributação de todos os produtos da compra (falta: TECLADO).' }
            );
        });

        it ( 'lança 400 quando é informado produto que não está na compra', async () =>
        {
            const itens = [ ...TRIBUTACAO, { ...TRIBUTACAO[ 0 ], codProduto: 99 } ];

            await expect ( service.CalcularNotaFiscal ( { ...NOTA_ID, itens } ) ).rejects.toMatchObject
            (
                { status: 400, message: 'O produto 99 não pertence à compra.' }
            );
        });
    });

    describe ( 'GerarNotaFiscal', () =>
    {
        it ( 'grava cabeçalho e itens com a chave da compra, copiando quantidade, valor e desconto', async () =>
        {
            repo.FindById
                .mockResolvedValueOnce ( null )
                .mockResolvedValue     ( NOTA_ATIVA );

            const nota = await service.GerarNotaFiscal ( NOVA_NOTA, 1 );

            expect ( repo.Create ).toHaveBeenCalledWith
            (
                NOTA_ID,
                {
                    chaveAcessoNfe: NOVA_NOTA.chaveAcessoNfe,
                    dhEmiNfe:       NOVA_NOTA.dhEmiNfe,
                    dhSaiNfe:       null,
                    fretePorConta:  'Emitente',
                    infoCompl:      null,
                },
                1,
                {}
            );
            expect ( repo.CreateItem ).toHaveBeenCalledTimes ( 2 );
            expect ( repo.CreateItem ).toHaveBeenCalledWith
            (
                NOTA_ID,
                {
                    codProduto:    8,
                    cfop:          '1102',
                    csosn:         '102',
                    quantidade:    10,
                    valorUnitario: '210.00',
                    desconto:      '100.00',
                    aliqIcms:      '12.00',
                    aliqIpi:       '0.00',
                },
                1,
                {}
            );
            expect ( nota ).toMatchObject ( NOTA_ID );
        });

        it ( 'RN002 — lança 409 para compra cancelada', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( COMPRA_CANCELADA );

            await expect ( service.GerarNotaFiscal ( NOVA_NOTA, 1 ) ).rejects.toMatchObject
            (
                { status: 409, message: 'Não é possível gerar nota fiscal de uma compra cancelada.' }
            );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it.each
        ([
            [ 'gerada',    NOTA_ATIVA,     'Esta compra já possui nota fiscal gerada.' ],
            [ 'cancelada', NOTA_CANCELADA, 'A nota fiscal desta compra foi cancelada; não é possível gerar outra para o mesmo documento.' ],
        ])
        ( 'RN003 — lança 409 quando a compra já tem nota %s (a chave é a mesma)', async ( _rotulo, existente, mensagem ) =>
        {
            repo.FindById.mockResolvedValue ( existente );

            await expect ( service.GerarNotaFiscal ( NOVA_NOTA, 1 ) ).rejects.toMatchObject ( { status: 409, message: mensagem } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'lança 404 quando a compra não existe', async () =>
        {
            comprasRepo.FindById.mockResolvedValue ( null );

            await expect ( service.GerarNotaFiscal ( NOVA_NOTA, 1 ) ).rejects.toMatchObject ( { status: 404 } );
        });

        it ( 'lança 400 e não grava quando os itens não batem com a compra', async () =>
        {
            await expect ( service.GerarNotaFiscal ( { ...NOVA_NOTA, itens: [ TRIBUTACAO[ 1 ] ] }, 1 ) ).rejects.toMatchObject
            (
                { status: 400 }
            );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });
    });

    describe ( 'CancelarNotaFiscal', () =>
    {
        it ( 'grava a justificativa e devolve a nota cancelada', async () =>
        {
            repo.FindById.mockResolvedValue ( NOTA_ATIVA );
            repo.Cancelar.mockResolvedValue ( NOTA_CANCELADA );

            await service.CancelarNotaFiscal ( NOTA_ID, 'Chave digitada errada', 1 );

            expect ( repo.Cancelar ).toHaveBeenCalledWith ( NOTA_ID, 'Chave digitada errada', 1 );
        });

        it ( 'lança 404 quando a nota não existe', async () =>
        {
            await expect ( service.CancelarNotaFiscal ( NOTA_ID, 'x', 1 ) ).rejects.toMatchObject ( { status: 404 } );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando a nota já foi cancelada', async () =>
        {
            repo.FindById.mockResolvedValue ( NOTA_CANCELADA );

            await expect ( service.CancelarNotaFiscal ( NOTA_ID, 'x', 1 ) ).rejects.toMatchObject
            (
                { status: 409, message: 'Esta nota fiscal já foi cancelada.' }
            );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando outra requisição cancelou a nota antes', async () =>
        {
            repo.FindById.mockResolvedValue ( NOTA_ATIVA );
            repo.Cancelar.mockResolvedValue ( null );

            await expect ( service.CancelarNotaFiscal ( NOTA_ID, 'x', 1 ) ).rejects.toMatchObject ( { status: 409 } );
        });
    });
});
