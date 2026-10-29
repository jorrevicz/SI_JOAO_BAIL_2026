import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { criarCompraDeTeste, chaveAcessoDeTeste, type CompraDeTeste } from '../helpers/fixtures';

const BASE = '/api/notas-fiscais';

describe ( 'Notas fiscais routes', () =>
{
    let compra:          CompraDeTeste;
    let compraCancelada: CompraDeTeste;

    // As rotas usam o cliente `sql` da aplicação, fora de qualquer transação de teste —
    // por isso as compras são criadas numa transação comitada e removidas no afterAll.
    beforeAll ( async () =>
    {
        compra = await sql.begin ( ( transaction ) =>
            criarCompraDeTeste ( transaction, { numero: '060000001' } )
        ) as unknown as CompraDeTeste;

        compraCancelada = await sql.begin ( async ( transaction ) =>
        {
            const cancelada = await criarCompraDeTeste ( transaction, { numero: '060000002' }, compra.codForn );

            await transaction`
                UPDATE "Compras"
                SET "justificativaCancelamento" = 'Devolvida', "isActive" = false
                WHERE "numero" = ${ cancelada.numero } AND "codForn" = ${ cancelada.codForn }
            `;

            return cancelada;
        } ) as unknown as CompraDeTeste;
    });

    afterAll ( async () =>
    {
        const [ fornecedor ] = await sql < { codCidade: number }[] >`
            SELECT "codCidade" FROM "Fornecedores" WHERE "codForn" = ${ compra.codForn }
        `;
        const [ cidade ] = await sql < { codEstado: number }[] >`
            SELECT "codEstado" FROM "Cidades" WHERE "codCidade" = ${ fornecedor.codCidade }
        `;
        const [ estado ] = await sql < { codPais: number }[] >`
            SELECT "codPais" FROM "Estados" WHERE "codEstado" = ${ cidade.codEstado }
        `;

        await sql`DELETE FROM "ProdutoNfe"              WHERE "codFornecedor" = ${ compra.codForn }`;
        await sql`DELETE FROM "NotasFiscaisEletronicas" WHERE "codFornecedor" = ${ compra.codForn }`;
        await sql`DELETE FROM "CompraParcelas" WHERE "codForn" = ${ compra.codForn }`;
        await sql`DELETE FROM "CompraProduto"  WHERE "codForn" = ${ compra.codForn }`;
        await sql`DELETE FROM "Compras"        WHERE "codForn" = ${ compra.codForn }`;
        await sql`
            DELETE FROM "FormaDePagamento"
            WHERE "codFormaDePag" IN ( ${ compra.codFormaDePag }, ${ compraCancelada.codFormaDePag } )
        `;
        await sql`DELETE FROM "Produtos"            WHERE "codProd" IN ( ${ compra.codProduto }, ${ compraCancelada.codProduto } )`;
        await sql`DELETE FROM "Fornecedores"        WHERE "codForn"      = ${ compra.codForn }`;
        await sql`DELETE FROM "CondicaoDePagamento" WHERE "codCondDePag" = ${ compra.codCondDePag }`;
        await sql`DELETE FROM "Cidades"             WHERE "codCidade"    = ${ fornecedor.codCidade }`;
        await sql`DELETE FROM "Estados"             WHERE "codEstado"    = ${ cidade.codEstado }`;
        await sql`DELETE FROM "Paises"              WHERE "codPais"      = ${ estado.codPais }`;

        await sql.end();
    });

    // A NF-e tem as mesmas chaves da compra; na API da nota o fornecedor é `codFornecedor`.
    function ChaveNota ( origem: CompraDeTeste )
    {
        return { numero: origem.numero, modelo: origem.modelo, serie: origem.serie, codFornecedor: origem.codForn };
    }

    function NovaNota ( origem: CompraDeTeste, sobrescrever: Record < string, unknown > = {} )
    {
        return {
            ...ChaveNota ( origem ),
            chaveAcessoNfe: chaveAcessoDeTeste ( origem ),
            dhEmiNfe:       '2026-09-01T10:00:00Z',
            fretePorConta:  'Emitente',
            itens:
            [
                { codProduto: origem.codProduto, cfop: '1102', csosn: '102', aliqIcms: '18.00', aliqIpi: '5.00' },
            ],
            ...sobrescrever,
        };
    }

    // Mesmo segmento de rota da compra: a nota é identificada pelas chaves dela.
    function Rota ( origem: CompraDeTeste )
    {
        return `${ origem.numero }/${ origem.modelo }/${ origem.serie }/${ origem.codForn }`;
    }

    it ( 'GET /:numero/:modelo/:serie/:codFornecedor retorna 404 enquanto a compra não tem nota', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/${ Rota ( compra ) }` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Nota fiscal não encontrada.' } );
    });

    it ( 'POST /calculo devolve a prévia dos impostos e do total', async () =>
    {
        const res = await request ( app ).post ( `${ BASE }/calculo` ).send
        ( {
            ...ChaveNota ( compra ),
            itens: NovaNota ( compra ).itens,
        } );

        expect ( res.status ).toBe ( 200 );
        // 2 × 100,00 = 200,00; ICMS 18% = 36,00; IPI 5% = 10,00; total = 200 + 10 + 5 + 3 + 2
        expect ( res.body ).toMatchObject
        ({
            totalProdutos: '200.00',
            totalIcms:     '36.00',
            totalIpi:      '10.00',
            vlrTotalNota:  '220.00',
        });
        expect ( res.body.itens[ 0 ] ).toMatchObject ( { produto: 'PRODUTO COMPRA 060000001', quantidade: 2 } );
    });

    it ( 'POST / com chave de dígito verificador inválido retorna 400 no campo chaveAcessoNfe', async () =>
    {
        const valida   = chaveAcessoDeTeste ( compra );
        const invalida = `${ valida.slice ( 0, 43 ) }${ ( Number ( valida[ 43 ] ) + 1 ) % 10 }`;

        const res = await request ( app ).post ( BASE ).send ( NovaNota ( compra, { chaveAcessoNfe: invalida } ) );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros.chaveAcessoNfe ).toBe ( 'O dígito verificador da chave de acesso é inválido.' );
    });

    it ( 'POST / com chave de outro documento retorna 400 no campo chaveAcessoNfe', async () =>
    {
        const res = await request ( app ).post ( BASE ).send
        (
            NovaNota ( compra, { chaveAcessoNfe: chaveAcessoDeTeste ( { ...compra, numero: '060000999' } ) } )
        );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros.chaveAcessoNfe ).toBe ( 'A chave de acesso não corresponde ao modelo, à série e ao número do documento da compra.' );
    });

    it ( 'POST / com CFOP de saída retorna 400', async () =>
    {
        const res = await request ( app ).post ( BASE ).send
        (
            NovaNota ( compra, { itens: [ { codProduto: compra.codProduto, cfop: '5102', csosn: '102', aliqIcms: '0.00', aliqIpi: '0.00' } ] } )
        );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'itens' );
    });

    it ( 'POST / de compra cancelada retorna 409 (RN002)', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( NovaNota ( compraCancelada ) );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Não é possível gerar nota fiscal de uma compra cancelada.' } );
    });

    it ( 'POST / gera a nota da compra com itens e totais calculados', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( NovaNota ( compra ) );

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).not.toHaveProperty ( 'codNfe' );
        expect ( res.body ).toMatchObject
        ({
            ...ChaveNota ( compra ),
            fornecedor:    'FORNECEDOR DE TESTE',
            isActive:      true,
            vlrTotalNota:  '220.00',
        });
        expect ( res.body.itens[ 0 ] ).toMatchObject
        ({
            codProduto:    compra.codProduto,
            cfop:          '1102',
            quantidade:    2,
            valorUnitario: '100.00',
            valorIcms:     '36.00',
        });
    });

    it ( 'POST / de novo para a mesma compra retorna 409 (RN003)', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( NovaNota ( compra ) );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Esta compra já possui nota fiscal gerada.' } );
    });

    it ( 'a compra passa a expor a nota como Gerada e não pode ser cancelada enquanto ela estiver ativa', async () =>
    {
        const consulta = await request ( app ).get ( `/api/compras/${ Rota ( compra ) }` );

        expect ( consulta.body.situacaoNotaFiscal ).toBe ( 'Gerada' );

        const cancelamento = await request ( app )
            .patch ( `/api/compras/${ Rota ( compra ) }/cancelar` )
            .send ( { justificativaCancelamento: 'Teste' } );

        expect ( cancelamento.status ).toBe ( 409 );
        expect ( cancelamento.body.mensagem ).toBe ( 'Esta compra possui nota fiscal gerada; cancele a nota fiscal antes de cancelar a compra.' );
    });

    it ( 'GET pela chave da compra e GET / devolvem a nota gerada', async () =>
    {
        const porChave = await request ( app ).get ( `${ BASE }/${ Rota ( compra ) }` );
        expect ( porChave.status ).toBe ( 200 );
        expect ( porChave.body ).toMatchObject ( { ...ChaveNota ( compra ), totalIpi: '10.00' } );

        const lista = await request ( app ).get ( BASE ).query ( { codFornecedor: compra.codForn } );
        expect ( lista.status ).toBe ( 200 );
        expect ( lista.body ).toHaveLength ( 1 );
        expect ( lista.body[ 0 ] ).toMatchObject ( { ...ChaveNota ( compra ), vlrTotalNota: '220.00' } );
    });

    it ( 'PATCH .../cancelar exige justificativa, cancela e recusa um segundo cancelamento', async () =>
    {
        const semJustificativa = await request ( app ).patch ( `${ BASE }/${ Rota ( compra ) }/cancelar` ).send ( {} );
        expect ( semJustificativa.status ).toBe ( 400 );

        const cancelamento = await request ( app )
            .patch ( `${ BASE }/${ Rota ( compra ) }/cancelar` )
            .send ( { justificativaCancelamento: 'Chave digitada errada' } );

        expect ( cancelamento.status ).toBe ( 200 );
        expect ( cancelamento.body ).toMatchObject ( { isActive: false, justificativaCancelamento: 'Chave digitada errada' } );

        const deNovo = await request ( app )
            .patch ( `${ BASE }/${ Rota ( compra ) }/cancelar` )
            .send ( { justificativaCancelamento: 'De novo' } );

        expect ( deNovo.status ).toBe ( 409 );
    });

    it ( 'RN003 — a nota cancelada continua ocupando a chave: não se gera outra para a mesma compra', async () =>
    {
        const consulta = await request ( app ).get ( `/api/compras/${ Rota ( compra ) }` );
        expect ( consulta.body.situacaoNotaFiscal ).toBe ( 'Cancelada' );

        const res = await request ( app ).post ( BASE ).send ( NovaNota ( compra ) );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'A nota fiscal desta compra foi cancelada; não é possível gerar outra para o mesmo documento.' } );
    });

    it ( 'com a nota cancelada, a compra pode ser cancelada', async () =>
    {
        // A fixture grava a compra direto no banco, sem a entrada em estoque do lançamento:
        // simula essa entrada para o estorno do cancelamento ter o que devolver.
        await sql`UPDATE "Produtos" SET "estoque" = 2 WHERE "codProd" = ${ compra.codProduto }`;

        const res = await request ( app )
            .patch ( `/api/compras/${ Rota ( compra ) }/cancelar` )
            .send ( { justificativaCancelamento: 'Documento cancelado pelo fornecedor' } );

        expect ( res.body.mensagem ).toBeUndefined();
        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toMatchObject ( { isActive: false, situacaoNotaFiscal: 'Cancelada' } );
    });
});
