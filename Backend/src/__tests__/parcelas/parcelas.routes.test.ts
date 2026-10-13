import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Parcelas routes', () =>
{
    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/parcelas retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/parcelas' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/parcelas?codCondDePag=1 retorna array filtrado', async () =>
    {
        const res = await request ( app ).get ( '/api/parcelas?codCondDePag=1' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/parcelas/:codCondDePag/:numParcela inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( '/api/parcelas/999999/999999' );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/parcelas com payload inválido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/parcelas' )
            .send ( {} );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/parcelas sem numParcela retorna 400 (código manual obrigatório)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/parcelas' )
            .send ( { codCondDePag: 1, codFormaDePag: 1, percentual: 100, numDias: 30 } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.numParcela ).toBeDefined();
    });
});
