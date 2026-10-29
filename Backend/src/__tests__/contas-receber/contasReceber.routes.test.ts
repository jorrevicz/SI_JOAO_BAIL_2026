import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';
import { FormasPagamentoRepository } from '../../modules/formas-pagamento/formasPagamento.repository';

const BASE = '/api/contas-receber';

// Datas válidas padrão usadas nos payloads .
const DT_VENCIMENTO_ENVIO = '2026-01-10';
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
        codCliente:                 expect.any ( Number ),
        codFormaDePag:              expect.any ( Number ),
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
        const res = await request ( app ).get ( `${ BASE }/099999999/99/99/${ codCliente }/99` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Conta a receber não encontrada.' } );
    });

    it ( 'GET /api/contas-receber/validar com formato inválido retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '1', modelo: 'ab', serie: '01', codCliente, parcela: 1 } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
    });

    it ( 'GET /api/contas-receber/validar com documento inédito retorna 200', async () =>
    {
        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '000000209', modelo: '01', serie: '01', codCliente, parcela: 1 } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { valido: true } );
    });

    it ( 'GET /api/contas-receber/validar com documento já cadastrado retorna 409', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000210', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '10.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        const res = await request ( app )
            .get ( `${ BASE }/validar` )
            .query ( { numero: '000000210', modelo: '01', serie: '01', codCliente, parcela: 1 } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'POST /api/contas-receber com número zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000000', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
    });

    it ( 'POST /api/contas-receber com modelo e série zero-preenchidos retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000211', modelo: '00', serie: '00', parcela: 1,
                codCliente, codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
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
                numero: '000000212', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '0.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'valor' );
    });

    it ( 'POST /api/contas-receber com cliente inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000201', modelo: '01', serie: '01', parcela: 1,
                codCliente: 999999, codFormaDePag: codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Cliente informado não existe.' } );
    });

    it ( 'POST /api/contas-receber com forma de pagamento inexistente retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000202', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: 999999, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '100.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body ).toEqual ( { mensagem: 'Forma de pagamento informada não existe.' } );
    });

    it ( 'POST /api/contas-receber cria e retorna 201 com a conta completa', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '000000203', codCliente, codFormaDePag,
                dtVencimento: DT_VENCIMENTO_ISO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
            })
        );
    });

    it ( 'POST /api/contas-receber com a mesma chave (número, modelo, série, cliente e parcela) retorna 409', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    it ( 'POST /api/contas-receber aceita outra parcela do mesmo documento e do mesmo cliente', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000203', modelo: '01', serie: '01', parcela: 2,
                codCliente, codFormaDePag: codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '150.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body ).toMatchObject ( { numero: '000000203', codCliente, parcela: 2 } );
    });

    it ( 'PATCH /api/contas-receber/:.../cancelar cancela a conta e retorna a conta completa', async () =>
    {
        await request ( app )
            .post ( BASE )
            .send ({
                numero: '000000206', modelo: '01', serie: '01', parcela: 1,
                codCliente, codFormaDePag: codFormaDePag, dtVencimento: DT_VENCIMENTO_ENVIO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '10.00', dtBaixa: '2026-01-11',
            });

        const res = await request ( app )
            .patch ( `${ BASE }/000000206/01/01/${ codCliente }/1/cancelar` )
            .send ( { justificativaCancelamento: 'Venda desfeita pelo cliente' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual
        (
            EsperarConta
            ({
                numero: '000000206', codCliente, codFormaDePag,
                dtVencimento: DT_VENCIMENTO_ISO,
                valor: '80.00', juro: '0.00', desconto: '0.00', multa: '0.00', justificativaCancelamento: 'Venda desfeita pelo cliente', isActive: false,
            })
        );
    });


    it ( 'Sem edição, baixa nem exclusão: PUT, PATCH .../baixa e DELETE retornam 404', async () =>
    {
        const id = `${ BASE }/000000999/01/01/${ codCliente }/1`;

        expect ( ( await request ( app ).put ( id ).send ( {} ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).patch ( `${ id }/baixa` ).send ( {} ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).delete ( id ) ).status ).toBe ( 404 );
    });
});
