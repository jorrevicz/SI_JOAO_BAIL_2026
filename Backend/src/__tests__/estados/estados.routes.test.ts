import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Estados routes', () => {

    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/estados retorna 200 e um array', async () => {

        const res = await request ( app ).get ( '/api/estados' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/estados?codPais=1 retorna array filtrado por país', async () => {

        const res = await request ( app ).get ( '/api/estados?codPais=1' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/estados/:id inexistente retorna 404 com mensagem PT', async () => {

        const res = await request ( app ).get ( '/api/estados/999999' );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/estados com payload inválido retorna 400', async () => {

        const res = await request ( app ).post ( '/api/estados' ).send ( { uf: 'SP' } );

        expect ( res.status ).toBe ( 400 );
    });
});
