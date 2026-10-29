import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCompraDeTeste, criarFornecedorDeTeste } from '../helpers/fixtures';
import { ComprasRepository } from '../../modules/compras/compras.repository';

const repo = new ComprasRepository();

describe ( 'ComprasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'FindById traz o cabeçalho com fornecedor e condição', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '090000001' } );

            const achada = await repo.FindById
            (
                { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codForn: compra.codForn },
                transaction
            );

            expect ( achada ).toMatchObject
            ({
                numero:            '090000001',
                modelo:            '55',
                serie:             '01',
                codForn:           compra.codForn,
                fornecedor:        'FORNECEDOR DE TESTE',
                codCondDePag:      compra.codCondDePag,
                condicaoPagamento: 'CONDIÇÃO DE TESTE',
                codTransp:         null,
                transportadora:    null,
            });
            expect ( achada ).not.toHaveProperty ( 'vlrTotal' );
        });
    });

    it ( 'FindById devolve null para compra inexistente', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const achada = await repo.FindById ( { numero: '099999999', modelo: '99', serie: '99', codForn: 999999 }, transaction );

            expect ( achada ).toBeNull();
        });
    });

    it ( 'ListItens traz os itens com nome, unidade, estoque e preço de venda do produto', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '090000002' } );

            const itens = await repo.ListItens
            (
                { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codForn: compra.codForn },
                transaction
            );

            expect ( itens ).toHaveLength ( 1 );
            expect ( itens[ 0 ] ).toMatchObject
            ({
                codProduto:        compra.codProduto,
                produto:           'PRODUTO COMPRA 090000002',
                undProduto:        'UN',
                estoque:           0,
                precoVenda:        '10.00',
                quantidade:        2,
                valorUnitario:     '100.00',
                desconto:          '0.00',
            });
            expect ( itens[ 0 ] ).not.toHaveProperty ( 'valorRateio' );
        });
    });

    it ( 'List filtra por fornecedor', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const outroFornecedor = await criarFornecedorDeTeste ( transaction );

            const doFornecedor = await criarCompraDeTeste ( transaction, { numero: '090000003' } );
            await criarCompraDeTeste ( transaction, { numero: '090000004' }, outroFornecedor );

            const porFornecedor = await repo.List ( 100, undefined, { codForn: doFornecedor.codForn }, transaction );
            expect ( porFornecedor.map ( ( compra ) => compra.numero ) ).toEqual ( [ '090000003' ] );
            expect ( porFornecedor[ 0 ].fornecedor ).toBe ( 'FORNECEDOR DE TESTE' );
        });
    });

    it ( 'List pagina por cursor sobre a chave natural (numero, modelo, serie, codForn)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codForn = await criarFornecedorDeTeste ( transaction );

            await criarCompraDeTeste ( transaction, { numero: '090000005' }, codForn );
            await criarCompraDeTeste ( transaction, { numero: '090000006' }, codForn );
            await criarCompraDeTeste ( transaction, { numero: '090000007' }, codForn );

            const primeiraPagina = await repo.List ( 2, undefined, { codForn }, transaction );
            expect ( primeiraPagina.map ( ( compra ) => compra.numero ) ).toEqual ( [ '090000005', '090000006' ] );

            const ultima = primeiraPagina[ 1 ];
            const segundaPagina = await repo.List
            (
                2,
                { numero: ultima.numero, modelo: ultima.modelo, serie: ultima.serie, codForn: ultima.codForn },
                { codForn },
                transaction
            );
            expect ( segundaPagina.map ( ( compra ) => compra.numero ) ).toEqual ( [ '090000007' ] );
        });
    });

    it ( 'List também traz compras removidas (soft delete), marcadas como inativas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '090000008' } );

            await transaction`
                UPDATE "Compras" SET "isActive" = false WHERE "numero" = ${ compra.numero }
            `;

            const lista = await repo.List ( 100, undefined, { codForn: compra.codForn }, transaction );

            expect ( lista ).toHaveLength ( 1 );
            expect ( lista[ 0 ].isActive ).toBe ( false );
        });
    });

    it ( 'ExisteDocumento considera também compras removidas (a chave natural continua ocupada)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codForn      = await criarFornecedorDeTeste ( transaction );
            const chaveInedita = { numero: '090000009', modelo: '55', serie: '01', codForn };
            expect ( await repo.ExisteDocumento ( chaveInedita, transaction ) ).toBe ( false );

            await criarCompraDeTeste ( transaction, { numero: '090000009' }, codForn );
            expect ( await repo.ExisteDocumento ( chaveInedita, transaction ) ).toBe ( true );

            await transaction`
                UPDATE "Compras" SET "isActive" = false WHERE "numero" = '090000009'
            `;
            expect ( await repo.ExisteDocumento ( chaveInedita, transaction ) ).toBe ( true );
        });
    });

    it ( 'ExisteDocumento diferencia fornecedores: o mesmo número/modelo/série de outro fornecedor é inédito', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra         = await criarCompraDeTeste ( transaction, { numero: '090000017' } );
            const outroFornecedor = await criarFornecedorDeTeste ( transaction );
            const mesmaChave     = { numero: compra.numero, modelo: compra.modelo, serie: compra.serie };

            expect ( await repo.ExisteDocumento ( { ...mesmaChave, codForn: compra.codForn }, transaction ) ).toBe ( true );
            expect ( await repo.ExisteDocumento ( { ...mesmaChave, codForn: outroFornecedor }, transaction ) ).toBe ( false );

            // E as duas compras convivem no banco, cada uma com os seus itens.
            const outra = await criarCompraDeTeste ( transaction, { numero: compra.numero }, outroFornecedor );

            expect ( await repo.ListItens ( { ...mesmaChave, codForn: compra.codForn }, transaction ) ).toHaveLength ( 1 );
            expect ( await repo.ListItens ( { ...mesmaChave, codForn: outra.codForn }, transaction ) ).toHaveLength ( 1 );
        });
    });

    // ------------------------------------------------------------------
    // Escrita (Lotes C-2/C-3)
    // ------------------------------------------------------------------

    function CabecalhoDe ( compra: { codCondDePag: number } )
    {
        return {
            codTransp:    null,
            codCondDePag: compra.codCondDePag,
            dtEmissao:    new Date ( '2026-09-10T10:00:00Z' ),
            dtChegada:    new Date ( '2026-09-11T10:00:00Z' ),
            frete:        '1.00',
            seguro:       '2.00',
            despesas:     '3.00',
        };
    }

    const ITEM = {
        quantidade:        1,
        valorUnitario:     '100.00',
        desconto:          '0.00',
        unidade:           'CX',
    };

    it ( 'Create grava o cabeçalho já lançado e CreateItem grava os itens', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const base = await criarCompraDeTeste ( transaction, { numero: '090000010' } );
            const id   = { numero: '090000011', modelo: '55', serie: '01', codForn: base.codForn };

            const criada = await repo.Create ( { ...id, ...CabecalhoDe ( base ) }, 1, transaction );

            expect ( criada ).toMatchObject ( { ...id, codUser: 1 } );
            expect ( criada.dtEntrada ).toBeInstanceOf ( Date );

            await repo.CreateItem ( id, { codProduto: base.codProduto, ...ITEM }, 1, transaction );

            const itens = await repo.ListItens ( id, transaction );
            expect ( itens ).toHaveLength ( 1 );
            expect ( itens[ 0 ] ).toMatchObject ( { codProduto: base.codProduto, unidade: 'CX' } );
        });
    });

    it ( 'ListParcelas traz as parcelas da compra com a descrição da forma de pagamento (RN023)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const base = await criarCompraDeTeste ( transaction, { numero: '090000018' } );
            const id   = { numero: base.numero, modelo: base.modelo, serie: base.serie, codForn: base.codForn };

            const parcelas = await repo.ListParcelas ( id, transaction );

            expect ( parcelas ).toHaveLength ( 1 );
            expect ( parcelas[ 0 ] ).toMatchObject ( { numParcela: 1, valor: '200.00', formaDePag: 'FORMA DE TESTE' } );
        });
    });

    it ( 'CreateParcela grava as parcelas da compra', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const base = await criarCompraDeTeste ( transaction, { numero: '090000019' } );
            const id   = { numero: base.numero, modelo: base.modelo, serie: base.serie, codForn: base.codForn };

            await repo.CreateParcela
            (
                id,
                { numParcela: 2, codFormaDePag: base.codFormaDePag, valor: '50.00', dtVencimento: new Date ( '2026-11-01T10:00:00Z' ) },
                1,
                transaction
            );

            const parcelas = await repo.ListParcelas ( id, transaction );
            expect ( parcelas.map ( ( parcela ) => [ parcela.numParcela, parcela.valor ] ) ).toEqual ( [ [ 1, '200.00' ], [ 2, '50.00' ] ] );
        });
    });

    it ( 'Cancelar grava a justificativa só na compra ainda não cancelada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const base = await criarCompraDeTeste ( transaction, { numero: '090000016' } );
            const id   = { numero: base.numero, modelo: base.modelo, serie: base.serie, codForn: base.codForn };

            const cancelada = await repo.Cancelar ( id, 'Nota devolvida', 1, transaction );
            expect ( cancelada ).toMatchObject ( { justificativaCancelamento: 'Nota devolvida', isActive: false } );

            expect ( await repo.Cancelar ( id, 'De novo', 1, transaction ) ).toBeNull();
        });
    });
});
