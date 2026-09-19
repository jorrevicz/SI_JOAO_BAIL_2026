import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Procedimentos routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/procedimentos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/procedimentos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/procedimentos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/procedimentos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/procedimentos com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/procedimentos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/procedimentos com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/procedimentos' )
            .send ( { procedimento: 'A'.repeat ( 151 ) } );
        expect ( res.status ).toBe ( 400 );
    });
});
