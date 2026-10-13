import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComprasService } from '../../modules/compras/compras.service';
import type { CompraId } from '../../modules/compras/compras.repository';
import type { CreateCompraInput, CabecalhoCompraInput } from '../../modules/compras/compras.schema';

// A transação é neutralizada: o callback roda direto com um objeto vazio no lugar da
// TransactionSql, por isso as asserções sobre os repositórios terminam em `, {}`.
vi.mock ( '../../shared/transaction/withTransaction', () =>
({
    WithTransaction: ( fn: ( transaction: unknown ) => unknown ) => fn ( {} ),
}) );

const ID_TESTE: CompraId = { numero: '000000101', modelo: '55', serie: '01', codForn: 3 };

const CABECALHO: CabecalhoCompraInput =
{
    codTransp:    null,
    codCondDePag: 4,
    dtEmissao:    new Date ( '2026-09-20T10:00:00Z' ),
    dtChegada:    new Date ( '2026-09-22T14:00:00Z' ),
    frete:        '60.00',
    seguro:       '20.00',
    despesas:     '20.00',
    itens:
    [
        { codProduto: 7, quantidade: 5,  valorUnitario: '380.00', desconto: '0.00',   unidade: 'UN' },
        { codProduto: 8, quantidade: 10, valorUnitario: '210.00', desconto: '100.00', unidade: 'CX' },
    ],
    // RN023 — a soma das parcelas fecha no vlrTotal calculado (3900.00)
    parcelas:
    [
        { numParcela: 1, codFormaDePag: 2, valor: '1900.00', dtVencimento: new Date ( '2026-10-20T10:00:00Z' ) },
        { numParcela: 2, codFormaDePag: 2, valor: '2000.00', dtVencimento: new Date ( '2026-11-20T10:00:00Z' ) },
    ],
};

const NOVA_COMPRA: CreateCompraInput = { ...ID_TESTE, ...CABECALHO };

const COMPRA_LANCADA   = { ...ID_TESTE, justificativaCancelamento: null };
const COMPRA_CANCELADA = { ...ID_TESTE, justificativaCancelamento: 'Nota devolvida' };

type MockRepo = Record < string, ReturnType < typeof vi.fn > >;

function MakeMock ( metodos: string[], over: Partial < MockRepo > = {} ): MockRepo
{
    const mock: MockRepo = {};

    for ( const metodo of metodos )
    {
        mock[ metodo ] = vi.fn();
    }

    return { ...mock, ...over } as MockRepo;
}

describe ( 'ComprasService', () =>
{
    let repo:              MockRepo;
    let fornecedoresRepo:  MockRepo;
    let transportadorasRepo: MockRepo;
    let condicoesRepo:     MockRepo;
    let produtosRepo:      MockRepo;
    let parcelasCondicaoRepo: MockRepo;
    let formasPagamentoRepo:  MockRepo;
    let service:           ComprasService;

    beforeEach ( () =>
    {
        repo = MakeMock
        ([
            'List', 'FindById', 'ListItens', 'ExisteDocumento', 'Create',
            'CreateItem', 'Cancelar', 'ListParcelas', 'CreateParcela',
        ]);
        fornecedoresRepo    = MakeMock ( [ 'FindById' ] );
        transportadorasRepo = MakeMock ( [ 'FindById' ] );
        condicoesRepo       = MakeMock ( [ 'FindById' ] );
        produtosRepo        = MakeMock ( [ 'FindById', 'FindByIdForUpdate', 'AtualizarEstoqueCusto' ] );
        parcelasCondicaoRepo = MakeMock ( [ 'List' ] );
        formasPagamentoRepo  = MakeMock ( [ 'FindById' ] );

        // Por padrão todas as referências existem; cada teste derruba só a que interessa.
        fornecedoresRepo.FindById.mockResolvedValue    ( { codForn: 3 } );
        transportadorasRepo.FindById.mockResolvedValue ( { codTransp: 9 } );
        condicoesRepo.FindById.mockResolvedValue       ( { codCondDePag: 4 } );
        produtosRepo.FindById.mockResolvedValue        ( { codProd: 7 } );
        formasPagamentoRepo.FindById.mockResolvedValue ( { codFormaDePag: 2 } );
        repo.ListItens.mockResolvedValue ( [] );
        repo.ListParcelas.mockResolvedValue ( [] );

        service = new ComprasService
        (
            repo                as never,
            fornecedoresRepo    as never,
            transportadorasRepo as never,
            condicoesRepo       as never,
            produtosRepo        as never,
            parcelasCondicaoRepo as never,
            formasPagamentoRepo  as never,
        );
    });

    describe ( 'ListCompras', () =>
    {
        it ( 'delega ao repo com limite, cursor e filtros', async () =>
        {
            repo.List.mockResolvedValue ( [] );

            const cursor = { numero: '000000001', modelo: '55', serie: '01', codForn: 3 };

            await service.ListCompras ( 20, cursor, { codForn: 3 } );

            expect ( repo.List ).toHaveBeenCalledWith ( 20, cursor, { codForn: 3 } );
        });
    });

    describe ( 'FindCompra', () =>
    {
        it ( 'lança 404 quando a compra não existe', async () =>
        {
            repo.FindById.mockResolvedValue ( null );

            await expect ( service.FindCompra ( ID_TESTE ) ).rejects.toMatchObject
            (
                { status: 404, message: 'Compra não encontrada.' }
            );

            expect ( repo.ListItens ).not.toHaveBeenCalled();
        });

        it ( 'devolve o cabeçalho da compra com a lista de itens', async () =>
        {
            repo.FindById.mockResolvedValue ( { ...ID_TESTE, fornecedor: 'FORNECEDOR' } );
            repo.ListItens.mockResolvedValue
            ([
                { codProduto: 7, produto: 'MOUSE', quantidade: 2, valorUnitario: '100.00', desconto: '0.00' },
            ]);
            repo.ListParcelas.mockResolvedValue ( [ { numParcela: 1, valor: '10.00' } ] );

            const compra = await service.FindCompra ( ID_TESTE );

            expect ( repo.ListItens ).toHaveBeenCalledWith ( ID_TESTE );
            expect ( repo.ListParcelas ).toHaveBeenCalledWith ( ID_TESTE );
            expect ( compra ).toEqual
            ({
                ...ID_TESTE,
                fornecedor: 'FORNECEDOR',
                // calculados na leitura, nunca persistidos
                vlrTotal:   '200.00',
                itens:
                [
                    {
                        codProduto: 7, produto: 'MOUSE', quantidade: 2, valorUnitario: '100.00', desconto: '0.00',
                        percentualRateio: '100.00', valorRateio: '100.00', custoMedioProduto: '150.00',
                    },
                ],
                parcelas:   [ { numParcela: 1, valor: '10.00' } ],
            });
        });
    });

    describe ( 'ValidarChave (RN007)', () =>
    {
        it ( 'devolve { valido: true } quando o documento é inédito', async () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( false );

            await expect ( service.ValidarChave ( ID_TESTE ) ).resolves.toEqual ( { valido: true } );
            expect ( repo.ExisteDocumento ).toHaveBeenCalledWith ( ID_TESTE );
        });

        it ( 'lança 409 quando já existe compra com o mesmo número, modelo e série', async () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.ValidarChave ( ID_TESTE ) ).rejects.toMatchObject ( { status: 409 } );
        });
    });

    describe ( 'SimularCompra (prévia dos totais — RN011–RN012, RN015)', () =>
    {
        it ( 'devolve os totais calculados e, por item, o saldo e o custo médio resultantes e o preço de venda', async () =>
        {
            produtosRepo.FindById.mockResolvedValue
            (
                {
                    codProd: 7, produto: 'MOUSE', undProduto: 'UN', estoque: 8,
                    custoMedioProd: '100.00', custoProd: '100.00', precoVenda: '150.00',
                }
            );

            const simulacao = await service.SimularCompra
            ({
                frete:    '10.00',
                seguro:   '0.00',
                despesas: '0.00',
                itens:    [ { codProduto: 7, quantidade: 2, valorUnitario: '100.00', desconto: '0.00' } ],
            });

            expect ( simulacao ).toEqual
            ({
                totalProdutos:  '200.00',
                totalDescontos: '0.00',
                vlrTotal:       '200.00',
                totalQuantidade:    2,
                totalValorUnitario: '100.00',
                itens:
                [
                    {
                        codProduto:           7,
                        quantidade:           2,
                        valorUnitario:        '100.00',
                        desconto:             '0.00',
                        valorLiquido:         '200.00',
                        percentualRateio:     '100.00',
                        valorRateio:          '100.00',
                        custoMedioProduto:    '150.00',
                        produto:              'MOUSE',
                        undProduto:           'UN',
                        estoqueAtual:         8,
                        estoqueResultante:    10,
                        custoMedioResultante: '110.00',
                        precoVenda:           '150.00',
                    },
                ],
            });
        });

        it ( 'lança 400 quando um produto não existe', async () =>
        {
            produtosRepo.FindById.mockResolvedValue ( null );

            await expect
            (
                service.SimularCompra
                ({
                    frete: '0.00', seguro: '0.00', despesas: '0.00',
                    itens: [ { codProduto: 99, quantidade: 1, valorUnitario: '1.00', desconto: '0.00' } ],
                })
            ).rejects.toMatchObject ( { status: 400, message: 'Produto 99 não existe.' } );
        });
    });

    describe ( 'GerarParcelas (RN022)', () =>
    {
        const PEDIDO =
        {
            codCondDePag: 4,
            dtEmissao:    new Date ( '2026-09-20T10:00:00Z' ),
            frete:        '0.00',
            seguro:       '0.00',
            despesas:     '0.00',
            itens:        [ { codProduto: 7, quantidade: 10, valorUnitario: '100.00', desconto: '0.00' } ],
        };

        it ( 'gera as parcelas da condição sobre o vlrTotal calculado no Backend', async () =>
        {
            parcelasCondicaoRepo.List.mockResolvedValue
            ([
                { numParcela: 1, codFormaDePag: 2, percentual: '40.00', numDias: 30 },
                { numParcela: 2, codFormaDePag: 2, percentual: '60.00', numDias: 60 },
            ]);

            const resultado = await service.GerarParcelas ( PEDIDO );

            expect ( parcelasCondicaoRepo.List ).toHaveBeenCalledWith ( 100, 0, 4 );
            expect ( resultado ).toEqual
            ({
                vlrTotal: '1000.00',
                parcelas:
                [
                    { numParcela: 1, codFormaDePag: 2, valor: '400.00', dtVencimento: '2026-10-20T10:00:00.000Z' },
                    { numParcela: 2, codFormaDePag: 2, valor: '600.00', dtVencimento: '2026-11-19T10:00:00.000Z' },
                ],
            });
        });

        it ( 'lança 400 quando a condição de pagamento não existe', async () =>
        {
            condicoesRepo.FindById.mockResolvedValue ( null );

            await expect ( service.GerarParcelas ( PEDIDO ) ).rejects.toMatchObject
            (
                { status: 400, message: 'Condição de pagamento informada não existe.' }
            );
        });

        it ( 'lança 400 quando a condição não tem parcelas cadastradas', async () =>
        {
            parcelasCondicaoRepo.List.mockResolvedValue ( [] );

            await expect ( service.GerarParcelas ( PEDIDO ) ).rejects.toMatchObject ( { status: 400 } );
        });
    });

    describe ( 'CreateCompra', () =>
    {
        beforeEach ( () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( false );
            repo.FindById.mockResolvedValue ( COMPRA_LANCADA );
            produtosRepo.FindByIdForUpdate
                .mockResolvedValueOnce ( { codProd: 7, estoque: 25, custoMedioProd: '0.00',   custoProd: '380.00' } )
                .mockResolvedValueOnce ( { codProd: 8, estoque: 30, custoMedioProd: '200.00', custoProd: '210.00' } );
        });

        it ( 'grava só o que o usuário informa (sem vlrTotal, rateio nem custo) na mesma transação', async () =>
        {
            await service.CreateCompra ( NOVA_COMPRA, 1 );

            expect ( repo.Create ).toHaveBeenCalledWith
            (
                expect.objectContaining ( { ...ID_TESTE, codForn: 3 } ),
                1,
                {}
            );
            expect ( repo.Create.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty ( 'vlrTotal' );
            expect ( repo.CreateItem ).toHaveBeenCalledTimes ( 2 );
            expect ( repo.CreateItem ).toHaveBeenNthCalledWith
            (
                1,
                ID_TESTE,
                expect.objectContaining ( { codProduto: 7 } ),
                1,
                {}
            );
            expect ( repo.CreateItem.mock.calls[ 0 ][ 1 ] ).not.toHaveProperty ( 'valorRateio' );
        });

        it ( 'devolve a compra recém-criada com os itens', async () =>
        {
            repo.ListItens.mockResolvedValue ( [ { codProduto: 7 } ] );

            await expect ( service.CreateCompra ( NOVA_COMPRA, 1 ) ).resolves.toMatchObject
            (
                { ...ID_TESTE, itens: [ { codProduto: 7 } ] }
            );
        });

        it ( 'lança 409 quando o documento já existe (RN007) e não grava nada', async () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( true );

            await expect ( service.CreateCompra ( NOVA_COMPRA, 1 ) ).rejects.toMatchObject ( { status: 409 } );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it.each
        ([
            [ 'fornecedor',            () => fornecedoresRepo.FindById, 'Fornecedor informado não existe.'            ],
            [ 'condição de pagamento', () => condicoesRepo.FindById,    'Condição de pagamento informada não existe.' ],
            [ 'produto',               () => produtosRepo.FindById,     'Produto 7 não existe.'                       ],
        ])
        ( 'lança 400 quando %s não existe', async ( _rotulo, repositorio, mensagem ) =>
        {
            repositorio().mockResolvedValue ( null );

            await expect ( service.CreateCompra ( NOVA_COMPRA, 1 ) ).rejects.toMatchObject
            (
                { status: 400, message: mensagem }
            );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'grava a unidade informada no item (RN020) e as parcelas da compra (RN023) na mesma transação', async () =>
        {
            await service.CreateCompra ( NOVA_COMPRA, 1 );

            expect ( repo.CreateItem ).toHaveBeenNthCalledWith
            (
                2, ID_TESTE, expect.objectContaining ( { codProduto: 8, unidade: 'CX' } ), 1, {}
            );
            expect ( repo.CreateParcela ).toHaveBeenCalledTimes ( 2 );
            expect ( repo.CreateParcela ).toHaveBeenNthCalledWith
            (
                1, ID_TESTE, expect.objectContaining ( { numParcela: 1, valor: '1900.00', codFormaDePag: 2 } ), 1, {}
            );
        });

        it ( 'lança 400 e não grava nada quando a soma das parcelas diverge do vlrTotal (RN023)', async () =>
        {
            const parcelas = [ { ...NOVA_COMPRA.parcelas[ 0 ], valor: '1000.00' }, NOVA_COMPRA.parcelas[ 1 ] ];

            await expect
            (
                service.CreateCompra ( { ...NOVA_COMPRA, parcelas }, 1 )
            ).rejects.toMatchObject ( { status: 400 } );

            expect ( repo.Create ).not.toHaveBeenCalled();
            expect ( repo.CreateParcela ).not.toHaveBeenCalled();
        });

        it ( 'lança 400 quando a forma de pagamento de uma parcela não existe', async () =>
        {
            formasPagamentoRepo.FindById.mockResolvedValue ( null );

            await expect ( service.CreateCompra ( NOVA_COMPRA, 1 ) ).rejects.toMatchObject
            (
                { status: 400, message: 'Forma de pagamento 2 não existe.' }
            );
            expect ( repo.Create ).not.toHaveBeenCalled();
        });

        it ( 'confere a transportadora só quando informada', async () =>
        {
            await service.CreateCompra ( NOVA_COMPRA, 1 );
            expect ( transportadorasRepo.FindById ).not.toHaveBeenCalled();

            transportadorasRepo.FindById.mockResolvedValue ( null );

            await expect
            (
                service.CreateCompra ( { ...NOVA_COMPRA, codTransp: 9 }, 1 )
            ).rejects.toMatchObject ( { status: 400, message: 'Transportadora informada não existe.' } );
        });
    });

    describe ( 'CreateCompra — lançamento (RN013, RN018)', () =>
    {
        beforeEach ( () =>
        {
            repo.ExisteDocumento.mockResolvedValue ( false );
            repo.FindById.mockResolvedValue ( COMPRA_LANCADA );
        });

        it ( 'dá entrada de cada item no estoque/custo médio na mesma transação do cadastro', async () =>
        {
            produtosRepo.FindByIdForUpdate
                .mockResolvedValueOnce ( { codProd: 7, estoque: 25, custoMedioProd: '0.00',   custoProd: '380.00' } )
                .mockResolvedValueOnce ( { codProd: 8, estoque: 30, custoMedioProd: '200.00', custoProd: '210.00' } );

            await service.CreateCompra ( NOVA_COMPRA, 1 );

            expect ( produtosRepo.FindByIdForUpdate ).toHaveBeenNthCalledWith ( 1, 7, {} );

            // custo unitário final calculado na hora: 389,74 e 205,13 (rateio pelo líquido)
            // MOUSE: (25 × 380,00 + 5 × 389,74) / 30 = 381,62 (média parte do custo inicial)
            expect ( produtosRepo.AtualizarEstoqueCusto ).toHaveBeenNthCalledWith
            (
                1, 7, { estoque: 30, custoMedioProd: '381.62', custoProd: '389.74' }, 1, {}
            );
            // SSD: (30 × 200,00 + 10 × 205,13) / 40 = 201,28
            expect ( produtosRepo.AtualizarEstoqueCusto ).toHaveBeenNthCalledWith
            (
                2, 8, { estoque: 40, custoMedioProd: '201.28', custoProd: '205.13' }, 1, {}
            );
        });

        it ( 'lança 409 (e a transação reverte) quando um produto não está mais ativo', async () =>
        {
            produtosRepo.FindByIdForUpdate
                .mockResolvedValueOnce ( { codProd: 7, estoque: 25, custoMedioProd: '0.00', custoProd: '380.00' } )
                .mockResolvedValueOnce ( null );

            await expect ( service.CreateCompra ( NOVA_COMPRA, 1 ) ).rejects.toMatchObject
            (
                { status: 409, message: 'O produto 8 não está ativo; a compra não pode ser lançada.' }
            );
        });
    });

    describe ( 'CancelarCompra (RN014)', () =>
    {
        const ITENS = [ { codProduto: 7, produto: 'MOUSE', quantidade: 5, valorUnitario: '380.00', desconto: '0.00' } ];

        it ( 'grava a justificativa e estorna estoque/custo de cada item na mesma transação', async () =>
        {
            repo.FindById.mockResolvedValue ( COMPRA_LANCADA );
            repo.Cancelar.mockResolvedValue ( COMPRA_CANCELADA );
            repo.ListItens.mockResolvedValue ( ITENS );
            produtosRepo.FindByIdForUpdate.mockResolvedValue
            (
                { codProd: 7, estoque: 30, custoMedioProd: '381.62', custoProd: '389.74' }
            );

            await service.CancelarCompra ( ID_TESTE, 'Nota devolvida', 1 );

            expect ( repo.Cancelar ).toHaveBeenCalledWith ( ID_TESTE, 'Nota devolvida', 1, {} );
            // item sozinho na compra: custo unitário (1.900,00 + rateio 100,00) / 5 = 400,00
            // (30 × 381,62 − 5 × 400,00) / 25 = 377,94
            expect ( produtosRepo.AtualizarEstoqueCusto ).toHaveBeenCalledWith
            (
                7, { estoque: 25, custoMedioProd: '377.94', custoProd: '389.74' }, 1, {}
            );
        });

        it.each
        ([
            [ 'já cancelada', COMPRA_CANCELADA, 'Esta compra já foi cancelada.' ],
        ])
        ( 'lança 409 quando a compra está %s', async ( _rotulo, compra, mensagem ) =>
        {
            repo.FindById.mockResolvedValue ( compra );

            await expect ( service.CancelarCompra ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject
            (
                { status: 409, message: mensagem }
            );
            expect ( repo.Cancelar ).not.toHaveBeenCalled();
        });

        it ( 'lança 409 quando o estoque atual não comporta o estorno', async () =>
        {
            repo.FindById.mockResolvedValue ( COMPRA_LANCADA );
            repo.Cancelar.mockResolvedValue ( COMPRA_CANCELADA );
            repo.ListItens.mockResolvedValue ( ITENS );
            produtosRepo.FindByIdForUpdate.mockResolvedValue
            (
                { codProd: 7, estoque: 2, custoMedioProd: '381.62', custoProd: '389.74' }
            );

            await expect ( service.CancelarCompra ( ID_TESTE, 'motivo', 1 ) ).rejects.toMatchObject
            (
                { status: 409, message: 'Estoque insuficiente para estornar o produto MOUSE (5 unidades).' }
            );
        });
    });
});
