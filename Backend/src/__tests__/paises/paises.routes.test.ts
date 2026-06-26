import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe
(
    'Paises routes', () => {
        afterAll (
            async () => { 
                await sql.end();
            }
        );

        it ( 'GET /api/paises retorna 200 e um array', async () => {
            const res = await request ( app ).get( '/api/paises' );
            expect ( res.status ).toBe( 200 );
            expect ( Array.isArray ( res.body) ).toBe( true );
        });

        it('GET /api/paises/:id inexistente retorna 404 com mensagem PT', async () => {
            const res = await request(app).get('/api/paises/999999');
            expect ( res.status ).toBe(404);
            expect ( res.body.mensagem ).toBeDefined();
        });

        it('POST /api/paises com payload inválido retorna 400', 
            async () => {
                const res = await request( app ).post( '/api/paises' ).send( { sigla: 'BR' } );
                expect ( res.status ).toBe( 400 );
        });
    }
);