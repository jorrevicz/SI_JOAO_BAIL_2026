import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Produtos routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/produtos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/produtos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/produtos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/produtos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/produtos com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/produtos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produtos com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send ( { produto: 'A'.repeat ( 101 ) } );
        expect ( res.status ).toBe ( 400 );
    });
});
