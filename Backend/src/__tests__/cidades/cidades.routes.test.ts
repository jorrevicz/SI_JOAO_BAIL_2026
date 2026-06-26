import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Cidades routes', () => {

    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/cidades retorna 200 e um array', async () => {

        const res = await request ( app ).get ( '/api/cidades' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/cidades?codEstado=1 retorna array filtrado por estado', async () => {

        const res = await request ( app ).get ( '/api/cidades?codEstado=1' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/cidades/:id inexistente retorna 404 com mensagem PT', async () => {

        const res = await request ( app ).get ( '/api/cidades/999999' );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/cidades com payload inválido retorna 400', async () => {

        const res = await request 
            ( app ).post ( '/api/cidades' ).send ( { cidade: 'Campinas' } );

        expect ( res.status ).toBe ( 400 );
    });
});
