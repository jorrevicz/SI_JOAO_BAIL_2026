import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Pecas routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/pecas retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/pecas' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/pecas/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/pecas/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/pecas com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/pecas' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/pecas com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/pecas' )
            .send ( { peca: 'A'.repeat ( 21 ) } );
        expect ( res.status ).toBe ( 400 );
    });

    describe ( 'ciclo de vida de uma peça', () =>
    {
        const PECA_TESTE = { peca: 'Placa-mãe Teste' };
        let codPecaCriada: number;

        it ( 'POST cria a peça com os valores enviados', async () =>
        {
            const res = await request ( app ).post ( '/api/pecas' ).send ( PECA_TESTE );

            expect ( res.status ).toBe ( 201 );
            expect ( res.body.peca ).toBe ( PECA_TESTE.peca );
            expect ( res.body.isActive ).toBe ( true );

            codPecaCriada = res.body.codPeca;
        });

        it ( 'GET /api/pecas/:id recupera a peça recém-criada com os mesmos valores', async () =>
        {
            const res = await request ( app ).get ( `/api/pecas/${ codPecaCriada }` );

            expect ( res.status ).toBe ( 200 );
            expect ( res.body.peca ).toBe ( PECA_TESTE.peca );
        });

        it ( 'DELETE /api/pecas/:id remove a peça', async () =>
        {
            const res = await request ( app ).delete ( `/api/pecas/${ codPecaCriada }` );
            expect ( res.status ).toBe ( 204 );
        });

        it ( 'GET /api/pecas/:id após a remoção retorna 404', async () =>
        {
            const res = await request ( app ).get ( `/api/pecas/${ codPecaCriada }` );
            expect ( res.status ).toBe ( 404 );
        });
    });
});
