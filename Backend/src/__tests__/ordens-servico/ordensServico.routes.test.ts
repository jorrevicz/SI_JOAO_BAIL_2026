import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Ordens de Serviço routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/ordens-servico retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/ordens-servico' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/ordens-servico/:numOdS inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/ordens-servico/ZZ999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/ordens-servico com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/ordens-servico' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/ordens-servico com numOdS de tamanho errado retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/ordens-servico' )
            .send
            ({
                numOdS: 'OS1', codCliente: 1, atendente: 'Ana', defeito: 'Não liga', tipoOdS: 'Garantia',
                aparelho:    { modelo: 'X', voltagem: 'Bivolt', garantia: '12 meses' },
                equipamento: {
                    equipamento: 'Notebook', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                    tipoOffice: '2021', placaMae: 'Dell', bios: '1.0', capacidadeRam: '8GB',
                    capacidadeArmz: '256GB', usoArmz: '50%',
                },
            });
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico em OS inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .patch ( '/api/ordens-servico/ZZ999999/diagnostico' )
            .send ( { historicoManutencao: 'Teste', procedimentos: [], orcamentoPecas: [] } );
        expect ( res.status ).toBe ( 404 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/procedimentos em OS inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .patch ( '/api/ordens-servico/ZZ999999/procedimentos' )
            .send ( { procedimentos: [] } );
        expect ( res.status ).toBe ( 404 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/procedimentos com ordem repetida retorna 400 com mensagem PT', async () =>
    {
        const res = await request ( app )
            .patch ( '/api/ordens-servico/ZZ999999/procedimentos' )
            .send ( { procedimentos: [ { codProcedimento: 1, ordem: 1 }, { codProcedimento: 2, ordem: 1 } ] } );
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toEqual
        ( { procedimentos: 'A lista de procedimentos não pode repetir a mesma ordem.' } );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico com checagem=false sem observação retorna 400 com mensagem PT', async () =>
    {
        const res = await request ( app )
            .patch ( '/api/ordens-servico/ZZ999999/diagnostico' )
            .send
            ({
                historicoManutencao: null,
                procedimentos: [ { codProcedimento: 1, posicao: 'Embaixo', checagem: false, dthFim: '2026-01-01T10:00:00Z' } ],
                orcamentoPecas: [],
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toEqual
        ( { procedimentos: 'Observação é obrigatória quando a checagem não é confirmada.' } );
    });
});
