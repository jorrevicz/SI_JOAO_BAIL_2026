import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { FornecedoresRepository } from '../../modules/fornecedores/fornecedores.repository';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';

const BASE = '/api/contas-pagamento';

// Datas válidas padrão usadas nos payloads (vencimento após a emissão).
const DT_EMISSAO_ENVIO    = '2026-01-01';
const DT_VENCIMENTO_ENVIO = '2026-01-10';
const DT_EMISSAO_ISO      = '2026-01-01T00:00:00.000Z';
const DT_VENCIMENTO_ISO   = '2026-01-10T00:00:00.000Z';

function EsperarConta
(
    overrides: Record < string, unknown >
)
{
    return {
        numero:                     '000000000',
        modelo:                     '01',
        serie:                      '01',
        parcela:                    1,
        codFornecedor:              expect.any ( Number ),
        codFormaDePag:              expect.any ( Number ),
        dtEmissao:                  null,
        dtVencimento:               null,
        valor:                      null,
        juro:                       '0.00',
        desconto:                   '0.00',
        multa:                      '0.00',
        vlrTotal:                   expect.any ( String ),
        valorBaixa:                 '10.00',
        dtBaixa:                    '2026-01-11T00:00:00.000Z',
        justificativaCancelamento:  null,
        codUser:                    1,
        isActive:                   true,
        dtCriacao:                  expect.any ( String ),
        dtEdicao:                   expect.any ( String ),
        ...overrides,
    };
}

describe ( 'ContasPagamento routes', () =>
{
    let codPais:        number;
    let codEstado:      number;
    let codCidade:      number;
    let codCondDePag:   number;
    let codFornecedor:  number;
    let codFormaDePag:  number;
    let outraFormaDePag: number;

    beforeAll ( async () =>
    {
        const [ pais ] = await sql < { codPais: number }[] >`
            INSERT INTO "Paises" ( "pais", "sigla", "ddi", "moeda", "codUser" )
            VALUES ( 'ROTACP', 'RC', '00', 'ZZZ', 1 )
            RETURNING "codPais"
        `;
        codPais = pais.codPais;

        const [ estado ] = await sql < { codEstado: number }[] >`
            INSERT INTO "Estados" ( "codPais", "uf", "estado", "codUser" )
            VALUES ( ${ codPais }, 'RC', 'Estado Rota CP', 1 )
            RETURNING "codEstado"
        `;
        codEstado = estado.codEstado;

        const [ cidade ] = await sql < { codCidade: number }[] >`
            INSERT INTO "Cidades" ( "codEstado", "cidade", "ddd", "codUser" )
            VALUES ( ${ codEstado }, 'Cidade Rota Contas Pagar', '11', 1 )
            RETURNING "codCidade"
        `;
        codCidade = cidade.codCidade;

        const [ condicao ] = await sql < { codCondDePag: number }[] >`
            INSERT INTO "CondicaoDePagamento" ( "descricao", "juroCondPag", "multaCondPag", "descontoCondPag", "codUser" )
            VALUES ( 'Condição Rota Contas Pagar', 0, 0, 0, 1 )
            RETURNING "codCondDePag"
        `;
        codCondDePag = condicao.codCondDePag;

        const fornecedor = await new FornecedoresRepository().Create
        (
            {
                codCidade, codCondDePag, fornecedor: 'Fornecedor Rota Contas Pagar',
                tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
            },
            1
        );
        codFornecedor = fornecedor.codForn;

        const forma = await new FormasPagamentoRepository().Create ( { formaDePag: 'Forma Rota Contas Pagar', prazoCompensacao: 0 }, 1 );
        codFormaDePag = forma.codFormaDePag;

        const outraForma = await new FormasPagamentoRepository().Create ( { formaDePag: 'Outra Forma Rota Contas Pagar', prazoCompensacao: 0 }, 1 );
        outraFormaDePag = outraForma.codFormaDePag;
    });

    afterAll ( async () =>
    {
        await sql`DELETE FROM "ContasAPagar"       WHERE "codFornecedor" = ${ codFornecedor }`;
        await sql`DELETE FROM "Fornecedores"        WHERE "codForn"       = ${ codFornecedor }`;
        await sql`DELETE FROM "FormaDePagamento"    WHERE "codFormaDePag" IN ( ${ codFormaDePag }, ${ outraFormaDePag } )`;
        await sql`DELETE FROM "CondicaoDePagamento" WHERE "codCondDePag"  = ${ codCondDePag }`;
        await sql`DELETE FROM "Cidades"             WHERE "codCidade"     = ${ codCidade }`;
        await sql`DELETE FROM "Estados"             WHERE "codEstado"     = ${ codEstado }`;
        await sql`DELETE FROM "Paises"              WHERE "codPais"       = ${ codPais }`;

        await sql.end();
    });

    it ( 'GET /api/contas-pagamento retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( BASE );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/contas-pagamento/:numero/:modelo/:serie/:parcela inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/099999999/99/99/${ codFornecedor }/99` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a pagar não encontrada.' } );
    });

    it ( 'GET /api/contas-pagamento/validar com formato inválido retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '1', modelo: 'ab', serie: '01', codFornecedor, parcela: 1 } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
    });

    it ( 'GET /api/contas-pagamento/validar com documento inédito retorna 200', async () =>
    {
        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '000000209', modelo: '01', serie: '01', codFornecedor, parcela: 1 } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { valido: true } );
    });

    it ( 'GET /api/contas-pagamento/validar com documento já cadastrado retorna 409', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000210', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '10.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '000000210', modelo: '01', serie: '01', codFornecedor, parcela: 1 } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'POST /api/contas-pagamento com payload vazio retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( {} );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual
        ({
            mensagem: [
                'Too big: expected string to have <=2 characters',
                'O identificador deve conter apenas números.',
                'O identificador deve conter apenas números.',
                'Too big: expected string to have <=2 characters',
                'O identificador deve conter apenas números.',
                'O código da parcela deve ser um número.',
                'O código do fornecedor deve ser um número.',
                'A data de emissão é inválida.',
                'A data de vencimento é inválida.',
                'O código da forma de pagamento deve ser um número.',
                'O valor do juro deve ser um decimal e positivo.',
                'O valor do desconto deve ser um decimal e positivo.',
                'O valor da multa deve ser um decimal e positivo.',
                'O valor da conta deve ser um decimal e positivo.',
                'O valor da baixa deve ser um decimal e positivo.',
                'A data da baixa é inválida',
            ].join ( '; ' ),
            erros: {
                numero:        'O identificador deve conter apenas números.',
                modelo:        'Too big: expected string to have <=2 characters',
                serie:         'Too big: expected string to have <=2 characters',
                parcela:       'O código da parcela deve ser um número.',
                codFornecedor: 'O código do fornecedor deve ser um número.',
                dtEmissao:     'A data de emissão é inválida.',
                dtVencimento:  'A data de vencimento é inválida.',
                codFormaDePag: 'O código da forma de pagamento deve ser um número.',
                juro:          'O valor do juro deve ser um decimal e positivo.',
                desconto:      'O valor do desconto deve ser um decimal e positivo.',
                multa:         'O valor da multa deve ser um decimal e positivo.',
                valor:         'O valor da conta deve ser um decimal e positivo.',
                valorBaixa:    'O valor da baixa deve ser um decimal e positivo.',
                dtBaixa:       'A data da baixa é inválida',
            },
        });
    });

    it ( 'POST /api/contas-pagamento com vencimento anterior à emissão retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000214', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: '2026-01-10', dtVencimento: '2026-01-01',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual
        ({
            mensagem: 'A data de vencimento não pode ser igual ou anterior à data de emissão.',
            erros: { dtVencimento: 'A data de vencimento não pode ser igual ou anterior à data de emissão.' },
        });
    });

    it ( 'POST /api/contas-pagamento com vencimento igual à emissão (mesmo instante) retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000216', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: '2026-01-05T10:00', dtVencimento: '2026-01-05T10:00',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'dtVencimento' );
    });

    it ( 'POST /api/contas-pagamento com vencimento mais tarde no mesmo dia da emissão retorna 201', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000215', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: '2026-01-05T08:00', dtVencimento: '2026-01-05T23:59',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( new Date ( res.body.dtVencimento ).getTime() ).toBeGreaterThan ( new Date ( res.body.dtEmissao ).getTime() );
    });

    it ( 'POST /api/contas-pagamento com número zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000000', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
    });

    it ( 'POST /api/contas-pagamento com modelo e série zero-preenchidos retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000211', modelo: '00', serie: '00', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
        expect ( res.body.erros ).toHaveProperty ( 'serie' );
    });

    it ( 'POST /api/contas-pagamento com valor zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000212', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '0.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'valor' );
    });

    it ( 'POST /api/contas-pagamento com fornecedor inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000201', modelo: '01', serie: '01', parcela: 1,
                codFornecedor: 999999, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Fornecedor informado não existe.' } );
    });

    it ( 'POST /api/contas-pagamento com forma de pagamento inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000202', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag: 999999, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Forma de pagamento informada não existe.' } );
    });

    it ( 'POST /api/contas-pagamento cria e retorna 201 com a conta completa', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '000000203', codFornecedor, codFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'POST /api/contas-pagamento com a mesma chave (número, modelo, série, fornecedor e parcela) retorna 409', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'POST /api/contas-pagamento aceita outra parcela do mesmo documento e do mesmo fornecedor', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 2,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toMatchObject ( { numero: '000000203', codFornecedor, parcela: 2 } );
    });

    it ( 'PATCH /api/contas-pagamento/:.../cancelar cancela a conta e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000206', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/000000206/01/01/${ codFornecedor }/1/cancelar` )
            .send ( { justificativaCancelamento: 'Compra desfeita pelo fornecedor' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '000000206', codFornecedor, codFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00', justificativaCancelamento: 'Compra desfeita pelo fornecedor',
            })
        );
    });

    it ( 'PATCH /api/contas-pagamento/:.../cancelar numa conta já cancelada retorna 409', async () =>
    {
        const res = await request ( app )
            .patch ( `${ BASE }/000000206/01/01/${ codFornecedor }/1/cancelar` )
            .send ( { justificativaCancelamento: 'De novo' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Esta conta a pagar já foi cancelada.' } );
    });

    it ( 'Sem edição, baixa nem exclusão: PUT, PATCH .../baixa e DELETE retornam 404', async () =>
    {
        const id = `${ BASE }/000000206/01/01/${ codFornecedor }/1`;

        expect ( ( await request ( app ).put ( id ).send ( {} ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).patch ( `${ id }/baixa` ).send ( {} ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).delete ( id ) ).status ).toBe ( 404 );
    });

});
