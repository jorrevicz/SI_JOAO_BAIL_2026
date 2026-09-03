import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Clientes routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/clientes retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/clientes' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/clientes/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/clientes/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/clientes sem payload obrigatório retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/clientes' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/clientes com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/clientes' )
            .send ( { codCidade: 1, cliente: 'A'.repeat ( 129 ) } );
        expect ( res.status ).toBe ( 400 );
    });
});
