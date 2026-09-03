import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Transportadoras routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/transportadoras retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/transportadoras' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/transportadoras/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/transportadoras/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/transportadoras sem payload obrigatório retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/transportadoras' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/transportadoras com tipoPessoa inválido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/transportadoras' )
            .send ( { codCidade: 1, transportadora: 'Rápida Transportes', tipoPessoa: 'INVALIDO' } );
        expect ( res.status ).toBe ( 400 );
    });
});
