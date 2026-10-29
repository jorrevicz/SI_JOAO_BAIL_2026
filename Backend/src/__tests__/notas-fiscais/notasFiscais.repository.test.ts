import { describe, it, expect, afterAll } from 'vitest';
import type postgres from 'postgres';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCompraDeTeste, criarFornecedorDeTeste, chaveAcessoDeTeste, type CompraDeTeste } from '../helpers/fixtures';
import { NotasFiscaisRepository, type NotaFiscalId } from '../../modules/notas-fiscais/notasFiscais.repository';
import { ComprasRepository } from '../../modules/compras/compras.repository';

const repo        = new NotasFiscaisRepository();
const comprasRepo = new ComprasRepository();

// A NF-e tem as mesmas chaves da compra (o fornecedor é `codFornecedor` na nota).
function NotaId ( compra: CompraDeTeste ): NotaFiscalId
{
    return { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codFornecedor: compra.codForn };
}

function CompraId ( compra: CompraDeTeste )
{
    return { numero: compra.numero, modelo: compra.modelo, serie: compra.serie, codForn: compra.codForn };
}

// Gera a nota da compra de teste com o único item dela (2 × 100,00).
async function criarNotaDeTeste ( transaction: postgres.TransactionSql, compra: CompraDeTeste, codigoNumerico = '12345678' )
{
    await repo.Create
    (
        NotaId ( compra ),
        {
            chaveAcessoNfe: chaveAcessoDeTeste ( compra, codigoNumerico ),
            dhEmiNfe:       new Date ( '2026-09-01T10:00:00Z' ),
            dhSaiNfe:       null,
            fretePorConta:  'Emitente',
            infoCompl:      null,
        },
        1,
        transaction
    );

    await repo.CreateItem
    (
        NotaId ( compra ),
        {
            codProduto:    compra.codProduto,
            cfop:          '1102',
            csosn:         '102',
            quantidade:    2,
            valorUnitario: '100.00',
            desconto:      '0.00',
            aliqIcms:      '18.00',
            aliqIpi:       '5.00',
        },
        1,
        transaction
    );
}

describe ( 'NotasFiscaisRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'FindById pela chave da compra traz o cabeçalho com emitente, transporte e despesas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000001' } );
            await criarNotaDeTeste ( transaction, compra );

            const achada = await repo.FindById ( NotaId ( compra ), transaction );

            expect ( achada ).toMatchObject
            ({
                numero:          '070000001',
                modelo:          '55',
                serie:           '01',
                codFornecedor:   compra.codForn,
                fornecedor:      'FORNECEDOR DE TESTE',
                frete:           '5.00',
                seguro:          '3.00',
                despesas:        '2.00',
                codTransp:       null,
                transportadora:  null,
                fretePorConta:   'Emitente',
                isActive:        true,
                justificativaCancelamento: null,
            });
            expect ( achada ).not.toHaveProperty ( 'codNfe' );
            expect ( achada?.dtEmissaoCompra.toISOString() ).toBe ( '2026-09-01T10:00:00.000Z' );
        });
    });

    it ( 'FindById devolve null para compra sem nota', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000010' } );

            expect ( await repo.FindById ( NotaId ( compra ), transaction ) ).toBeNull();
        });
    });

    it ( 'ListItens devolve os itens com nomes de API e quantidade numérica', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000002' } );
            await criarNotaDeTeste ( transaction, compra );

            const itens = await repo.ListItens ( NotaId ( compra ), transaction );

            expect ( itens ).toEqual
            ([
                {
                    codProduto:    compra.codProduto,
                    produto:       'PRODUTO COMPRA 070000002',
                    undProduto:    'UN',
                    cfop:          '1102',
                    csosn:         '102',
                    quantidade:    2,
                    valorUnitario: '100.00',
                    desconto:      '0.00',
                    aliqIcms:      '18.00',
                    aliqIpi:       '5.00',
                },
            ]);
        });
    });

    it ( 'Cancelar desativa a nota com a justificativa e devolve null se ela já estava cancelada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000004' } );
            await criarNotaDeTeste ( transaction, compra );

            const cancelada = await repo.Cancelar ( NotaId ( compra ), 'Chave errada', 1, transaction );

            expect ( cancelada ).toMatchObject ( { isActive: false, justificativaCancelamento: 'Chave errada' } );
            expect ( await repo.Cancelar ( NotaId ( compra ), 'De novo', 1, transaction ) ).toBeNull();
            // A nota cancelada continua ocupando a chave da compra.
            expect ( await repo.FindById ( NotaId ( compra ), transaction ) ).toMatchObject ( { isActive: false } );
        });
    });

    it ( 'List filtra por fornecedor, pagina pela chave composta e inclui notas canceladas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codForn = await criarFornecedorDeTeste ( transaction );

            const primeira = await criarCompraDeTeste ( transaction, { numero: '070000005' }, codForn );
            const segunda  = await criarCompraDeTeste ( transaction, { numero: '070000006' }, codForn );
            await criarNotaDeTeste ( transaction, primeira );
            await criarNotaDeTeste ( transaction, segunda );
            await criarNotaDeTeste ( transaction, await criarCompraDeTeste ( transaction, { numero: '070000007' } ) );

            await repo.Cancelar ( NotaId ( segunda ), 'Chave errada', 1, transaction );

            const lista = await repo.List ( 100, undefined, { codFornecedor: codForn }, transaction );

            expect ( lista.map ( ( nota ) => nota.numero ) ).toEqual ( [ '070000005', '070000006' ] );
            expect ( lista[ 1 ].isActive ).toBe ( false );
            expect ( lista[ 0 ] ).toMatchObject ( { fornecedor: 'FORNECEDOR DE TESTE', frete: '5.00' } );

            const depoisDaPrimeira = await repo.List ( 100, NotaId ( primeira ), { codFornecedor: codForn }, transaction );

            expect ( depoisDaPrimeira.map ( ( nota ) => nota.numero ) ).toEqual ( [ '070000006' ] );
        });
    });

    it ( 'RN003 — a chave primária (chave da compra) recusa uma segunda nota, mesmo com a primeira cancelada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000008' } );
            await criarNotaDeTeste ( transaction, compra );
            await repo.Cancelar ( NotaId ( compra ), 'Chave errada', 1, transaction );

            await expect ( criarNotaDeTeste ( transaction, compra, '87654321' ) ).rejects.toMatchObject
            (
                { code: '23505', constraint_name: 'NotasFiscaisEletronicas_pkey' }
            );
        });
    });

    it ( 'a compra expõe a situação da nota (RN003): null, Gerada e Cancelada', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const compra = await criarCompraDeTeste ( transaction, { numero: '070000009' } );

            expect ( ( await comprasRepo.FindById ( CompraId ( compra ), transaction ) )?.situacaoNotaFiscal ).toBeNull();

            await criarNotaDeTeste ( transaction, compra );

            expect ( ( await comprasRepo.FindById ( CompraId ( compra ), transaction ) )?.situacaoNotaFiscal ).toBe ( 'Gerada' );

            const [ listada ] = await comprasRepo.List ( 100, undefined, { codForn: compra.codForn }, transaction );
            expect ( listada.situacaoNotaFiscal ).toBe ( 'Gerada' );

            await repo.Cancelar ( NotaId ( compra ), 'Chave errada', 1, transaction );

            expect ( ( await comprasRepo.FindById ( CompraId ( compra ), transaction ) )?.situacaoNotaFiscal ).toBe ( 'Cancelada' );
        });
    });
});
