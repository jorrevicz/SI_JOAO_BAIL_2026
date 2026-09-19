import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { FornecedoresRepository } from '../../modules/fornecedores/fornecedores.repository';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';

const BASE = '/api/contas-pagamento';

function EsperarConta
(
    overrides: Record < string, unknown >
)
{
    return {
        numero:                     '00000000',
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
        valorBaixa:                 null,
        dtBaixa:                    null,
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
                tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111',
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
        const res = await request ( app ).get ( `${ BASE }/99999999/99/99/99` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a pagar não encontrada.' } );
    });

    it ( 'POST /api/contas-pagamento com payload vazio retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( {} );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual
        ({
            mensagem: [
                'Too big: expected string to have <=8 characters',
                'O identificador deve conter apenas números.',
                'Too big: expected string to have <=2 characters',
                'O identificador deve conter apenas números.',
                'Too big: expected string to have <=2 characters',
                'O identificador deve conter apenas números.',
                'O código da parcela deve ser um número.',
                'O código do fornecedor deve ser um número.',
                'O código da forma de pagamento deve ser um número.',
                'O valor do juro deve ser um decimal e positivo.',
                'O valor do desconto deve ser um decimal e positivo.',
                'O valor da multa deve ser um decimal e positivo.',
                'O valor da conta deve ser um decimal e positivo.',
            ].join ( '; ' ),
            erros: {
                numero:        'Too big: expected string to have <=8 characters',
                modelo:        'Too big: expected string to have <=2 characters',
                serie:         'Too big: expected string to have <=2 characters',
                parcela:       'O código da parcela deve ser um número.',
                codFornecedor: 'O código do fornecedor deve ser um número.',
                codFormaDePag: 'O código da forma de pagamento deve ser um número.',
                juro:          'O valor do juro deve ser um decimal e positivo.',
                desconto:      'O valor do desconto deve ser um decimal e positivo.',
                multa:         'O valor da multa deve ser um decimal e positivo.',
                valor:         'O valor da conta deve ser um decimal e positivo.',
            },
        });
    });

    it ( 'POST /api/contas-pagamento com fornecedor inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000201', modelo: '01', serie: '01', parcela: 1,
                codFornecedor: 999999, codFormaDePag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Fornecedor informado não existe.' } );
    });

    it ( 'POST /api/contas-pagamento com forma de pagamento inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000202', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag: 999999, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Forma de pagamento informada não existe.' } );
    });

    it ( 'POST /api/contas-pagamento cria e retorna 201 com a conta completa', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000203', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000203', codFornecedor, codFormaDePag, valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'PUT /api/contas-pagamento/:.../ atualiza a conta e retorna a versão completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000204', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .put ( `${ BASE }/00000204/01/01/1` )
            .send ({
                numero: '00000204', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag: outraFormaDePag, valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true,
            });

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000204', codFornecedor, codFormaDePag: outraFormaDePag, valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'PUT /api/contas-pagamento/:.../ inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .put ( `${ BASE }/99999998/99/99/99` )
            .send ({
                numero: '99999998', modelo: '99', serie: '99', parcela: 99,
                codFornecedor, codFormaDePag, valor: '1.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true,
            });

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a pagar não encontrada.' } );
    });

    it ( 'PATCH /api/contas-pagamento/:.../baixa registra a baixa e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000205', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/baixa` )
            .send ( { valorBaixa: '100.00', dtBaixa: '2026-01-15' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000205', codFornecedor, codFormaDePag,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00', valorBaixa: '100.00', dtBaixa: '2026-01-15T00:00:00.000Z',
            })
        );
    });

    it ( 'PATCH /api/contas-pagamento/:.../baixa numa conta já baixada retorna 409', async () =>
    {
        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/baixa` )
            .send ( { valorBaixa: '100.00', dtBaixa: '2026-01-16' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Esta conta a pagar já foi baixada.' } );
    });

    it ( 'PATCH /api/contas-pagamento/:.../cancelar numa conta já baixada retorna 409', async () =>
    {
        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/cancelar` )
            .send ( { justificativaCancelamento: 'Tentativa inválida' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Não é possível cancelar uma conta a pagar já baixada.' } );
    });

    it ( 'PATCH /api/contas-pagamento/:.../cancelar cancela a conta e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000206', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/00000206/01/01/1/cancelar` )
            .send ( { justificativaCancelamento: 'Compra desfeita pelo fornecedor' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000206', codFornecedor, codFormaDePag,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00', justificativaCancelamento: 'Compra desfeita pelo fornecedor',
            })
        );
    });

    it ( 'DELETE /api/contas-pagamento/:.../ remove (soft delete) e some da consulta', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000207', modelo: '01', serie: '01', parcela: 1,
                codFornecedor, codFormaDePag, valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const del = await request ( app ).delete ( `${ BASE }/00000207/01/01/1` );
        expect ( del.status ).toBe ( 204 );
        expect ( del.body ).toEqual ( {} );

        const get = await request ( app ).get ( `${ BASE }/00000207/01/01/1` );
        expect ( get.status ).toBe ( 404 );
        expect ( get.body ).toEqual ( { mensagem: 'Conta a pagar não encontrada.' } );
    });
});
