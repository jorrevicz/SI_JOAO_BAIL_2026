import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Fornecedores routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/fornecedores retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/fornecedores' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/fornecedores/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/fornecedores/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/fornecedores sem payload obrigatório retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/fornecedores' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/fornecedores com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ( { codCidade: 1, fornecedor: 'A'.repeat ( 129 ) } );
        expect ( res.status ).toBe ( 400 );
    });
});
