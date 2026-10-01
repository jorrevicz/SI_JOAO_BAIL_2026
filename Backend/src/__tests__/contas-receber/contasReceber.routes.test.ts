import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';

const BASE = '/api/contas-receber';

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
        numero:                     '00000000',
        modelo:                     '01',
        serie:                      '01',
        parcela:                    1,
        codCliente:                 expect.any ( Number ),
        codFormaDePag:              expect.any ( Number ),
        dtEmissao:                  null,
        dtVencimento:               null,
        dtPagamento:                null,
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

describe ( 'ContasReceber routes', () =>
{
    let codPais:        number;
    let codEstado:      number;
    let codCidade:      number;
    let codCliente:     number;
    let codFormaDePag:  number;
    let outraFormaDePag: number;

    beforeAll ( async () =>
    {
        const [ pais ] = await sql < { codPais: number }[] >`
            INSERT INTO "Paises" ( "pais", "sigla", "ddi", "moeda", "codUser" )
            VALUES ( 'ROTACR', 'RR', '77', 'ZZZ', 1 )
            RETURNING "codPais"
        `;
        codPais = pais.codPais;

        const [ estado ] = await sql < { codEstado: number }[] >`
            INSERT INTO "Estados" ( "codPais", "uf", "estado", "codUser" )
            VALUES ( ${ codPais }, 'RC', 'Estado Rota CR', 1 )
            RETURNING "codEstado"
        `;
        codEstado = estado.codEstado;

        const [ cidade ] = await sql < { codCidade: number }[] >`
            INSERT INTO "Cidades" ( "codEstado", "cidade", "ddd", "codUser" )
            VALUES ( ${ codEstado }, 'Cidade Rota Contas Receber', '11', 1 )
            RETURNING "codCidade"
        `;
        codCidade = cidade.codCidade;

        const cliente = await new ClientesRepository().Create
        (
            {
                codCidade, cliente: 'Cliente Rota Contas Receber',
                tipoPessoa: 'JURIDICA', cepCl: '01310100', foneCl: '551133331111',
            } as never,
            1
        );
        codCliente = cliente.codCliente;

        const forma = await new FormasPagamentoRepository().Create ( { formaDePag: 'Forma Rota Contas Receber', prazoCompensacao: 0 }, 1 );
        codFormaDePag = forma.codFormaDePag;

        const outraForma = await new FormasPagamentoRepository().Create ( { formaDePag: 'Outra Forma Rota Contas Receber', prazoCompensacao: 0 }, 1 );
        outraFormaDePag = outraForma.codFormaDePag;
    });

    afterAll ( async () =>
    {
        await sql`DELETE FROM "ContasAReceber"    WHERE "codCliente"    = ${ codCliente }`;
        await sql`DELETE FROM "Clientes"          WHERE "codCliente"    = ${ codCliente }`;
        await sql`DELETE FROM "FormaDePagamento"  WHERE "codFormaDePag" IN ( ${ codFormaDePag }, ${ outraFormaDePag } )`;
        await sql`DELETE FROM "Cidades"           WHERE "codCidade"     = ${ codCidade }`;
        await sql`DELETE FROM "Estados"           WHERE "codEstado"     = ${ codEstado }`;
        await sql`DELETE FROM "Paises"            WHERE "codPais"       = ${ codPais }`;

        await sql.end();
    });

    it ( 'GET /api/contas-receber retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( BASE );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/contas-receber/:numero/:modelo/:serie/:parcela inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/99999999/99/99/99` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a receber não encontrada.' } );
    });

    it ( 'GET /api/contas-receber/validar com formato inválido retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '1', modelo: 'ab', serie: '01' } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
    });

    it ( 'GET /api/contas-receber/validar com documento inédito retorna 200', async () =>
    {
        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '00000209', modelo: '01', serie: '01' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { valido: true } );
    });

    it ( 'GET /api/contas-receber/validar com documento já cadastrado retorna 409', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000210', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '10.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '00000210', modelo: '01', serie: '01' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'POST /api/contas-receber com vencimento anterior à emissão retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000214', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: '2026-01-10', dtVencimento: '2026-01-01',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual
        ({
            mensagem: 'A data de vencimento não pode ser igual ou anterior à data de emissão.',
            erros: { dtVencimento: 'A data de vencimento não pode ser igual ou anterior à data de emissão.' },
        });
    });

    it ( 'POST /api/contas-receber com vencimento igual à emissão (mesmo instante) retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000216', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: '2026-01-05T10:00', dtVencimento: '2026-01-05T10:00',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'dtVencimento' );
    });

    it ( 'POST /api/contas-receber com vencimento mais tarde no mesmo dia da emissão retorna 201', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000215', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: '2026-01-05T08:00', dtVencimento: '2026-01-05T23:59',
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( new Date ( res.body.dtVencimento ).getTime() ).toBeGreaterThan ( new Date ( res.body.dtEmissao ).getTime() );
    });

    it ( 'POST /api/contas-receber com número zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000000', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
    });

    it ( 'POST /api/contas-receber com modelo e série zero-preenchidos retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000211', modelo: '00', serie: '00', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
        expect ( res.body.erros ).toHaveProperty ( 'serie' );
    });

    it ( 'POST /api/contas-receber com valor zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000212', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '0.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'valor' );
    });

    it ( 'POST /api/contas-receber com cliente inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000201', modelo: '01', serie: '01', parcela: 1,
                codCliente: 999999, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Cliente informado não existe.' } );
    });

    it ( 'POST /api/contas-receber com forma de pagamento inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000202', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: 999999, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Forma de pagamento informada não existe.' } );
    });

    it ( 'POST /api/contas-receber cria e retorna 201 com a conta completa', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000203', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000203', codCliente, codFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'POST /api/contas-receber com numero/modelo/serie já existentes retorna 409', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000203', modelo: '01', serie: '01', parcela: 2,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'PUT /api/contas-receber/:.../ atualiza a conta e retorna a versão completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000204', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .put ( `${ BASE }/00000204/01/01/1` )
            .send ({
                numero: '00000204', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: outraFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true,
            });

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000204', codCliente, codFormaDePag: outraFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '200.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'PUT /api/contas-receber/:.../ inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .put ( `${ BASE }/99999998/99/99/99` )
            .send ({
                numero: '99999998', modelo: '99', serie: '99', parcela: 99,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '1.00', juro: '0.00', desconto: '0.00', multa: '0.00', isActive: true,
            });

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a receber não encontrada.' } );
    });

    it ( 'PATCH /api/contas-receber/:.../baixa com valor zero-preenchido retorna 400', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000213', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/00000213/01/01/1/baixa` )
            .send ( { valorBaixa: '0.00', dtBaixa: '2026-01-15', dtPagamento: '2026-01-15' } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'valorBaixa' );
    });

    it ( 'PATCH /api/contas-receber/:.../baixa registra o recebimento e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000205', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/baixa` )
            .send ( { valorBaixa: '100.00', dtBaixa: '2026-01-15', dtPagamento: '2026-01-15' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000205', codCliente, codFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '100.00', dtBaixa: '2026-01-15T00:00:00.000Z', dtPagamento: '2026-01-15T00:00:00.000Z',
            })
        );
    });

    it ( 'PATCH /api/contas-receber/:.../baixa numa conta já baixada retorna 409', async () =>
    {
        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/baixa` )
            .send ( { valorBaixa: '100.00', dtBaixa: '2026-01-16', dtPagamento: '2026-01-16' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Esta conta a receber já foi baixada.' } );
    });

    it ( 'PATCH /api/contas-receber/:.../cancelar numa conta já baixada retorna 409', async () =>
    {
        const res = await request ( app )
            .patch ( `${ BASE }/00000205/01/01/1/cancelar` )
            .send ( { justificativaCancelamento: 'Tentativa inválida' } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Não é possível cancelar uma conta a receber já baixada.' } );
    });

    it ( 'PATCH /api/contas-receber/:.../cancelar cancela a conta e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000206', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/00000206/01/01/1/cancelar` )
            .send ( { justificativaCancelamento: 'Venda desfeita pelo cliente' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '00000206', codCliente, codFormaDePag,
                dtEmissao: DT_EMISSAO_ISO, dtVencimento: DT_VENCIMENTO_ISO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00', justificativaCancelamento: 'Venda desfeita pelo cliente',
            })
        );
    });

    it ( 'DELETE /api/contas-receber/:.../ remove (soft delete) e some da consulta', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '00000207', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtEmissao: DT_EMISSAO_ENVIO, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            });

        const del = await request ( app ).delete ( `${ BASE }/00000207/01/01/1` );
        expect ( del.status ).toBe ( 204 );
        expect ( del.body ).toEqual ( {} );

        const get = await request ( app ).get ( `${ BASE }/00000207/01/01/1` );
        expect ( get.status ).toBe ( 404 );
        expect ( get.body ).toEqual ( { mensagem: 'Conta a receber não encontrada.' } );
    });
});
