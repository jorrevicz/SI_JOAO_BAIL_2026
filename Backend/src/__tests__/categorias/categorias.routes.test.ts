import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Categorias routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/categorias retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/categorias' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/categorias/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/categorias/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/categorias com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/categorias' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/categorias com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/categorias' )
            .send ( { categoria: 'A'.repeat ( 41 ) } );
        expect ( res.status ).toBe ( 400 );
    });
});
