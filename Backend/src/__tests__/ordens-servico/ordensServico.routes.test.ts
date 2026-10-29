import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

const NUM_ODS_INEXISTENTE = 999999;

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
        const res = await request ( app ).get ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }` );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'DELETE /api/ordens-servico/:numOdS inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).delete ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }` );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/ordens-servico com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/ordens-servico' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico em OS inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/diagnostico` )
            .send ( { historicoManutencao: 'Teste', procedimentos: [], orcamentoPecas: [] } );
        expect ( res.status ).toBe ( 404 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/procedimentos em OS inexistente retorna 404', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/procedimentos` )
            .send ( { procedimentos: [] } );
        expect ( res.status ).toBe ( 404 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/procedimentos com ordem repetida retorna 400 com mensagem PT', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/procedimentos` )
            .send ( { procedimentos: [ { codProcedimento: 1, ordem: 1 }, { codProcedimento: 2, ordem: 1 } ] } );
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toEqual
        ( { procedimentos: 'A lista de procedimentos não pode repetir a mesma ordem.' } );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico com checagem=false sem observação retorna 400 com mensagem PT', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/diagnostico` )
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

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico com ficha de equipamento incompleta retorna 400 no campo equipamento', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/diagnostico` )
            .send
            ({
                historicoManutencao: null,
                procedimentos: [],
                orcamentoPecas: [],
                equipamento: { equipamento: 'Notebook Dell' },
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros.equipamento ).toBeTruthy();
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico aceita procedimento sem posição (campo opcional)', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/diagnostico` )
            .send
            ({
                historicoManutencao: null,
                procedimentos: [ { codProcedimento: 1, checagem: true, dthFim: '2026-01-01T10:00:00Z' } ],
                orcamentoPecas: [],
            });
        // Passou pela validação (Zod): o 404 vem do service, por a OS não existir.
        expect ( res.status ).toBe ( 404 );
    });

    it ( 'PATCH /api/ordens-servico/:numOdS/diagnostico rejeita posição com mais de 8 caracteres', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ NUM_ODS_INEXISTENTE }/diagnostico` )
            .send
            ({
                historicoManutencao: null,
                procedimentos: [ { codProcedimento: 1, posicao: 'Embaixo do gabinete', checagem: true, dthFim: '2026-01-01T10:00:00Z' } ],
                orcamentoPecas: [],
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros.procedimentos ).toBe ( 'A posição deve ter no máximo 8 caracteres.' );
    });
});
