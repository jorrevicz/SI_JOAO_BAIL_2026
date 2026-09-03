import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Veiculos routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/veiculos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/veiculos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/veiculos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/veiculos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/veiculos sem placa retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/veiculos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/veiculos com placa muito longa retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/veiculos' )
            .send ( { placaVeiculo: 'ABCDEFGH' } );
        expect ( res.status ).toBe ( 400 );
    });
});
