import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Cargos routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/cargos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/cargos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/cargos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/cargos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/cargos com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/cargos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/cargos com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/cargos' )
            .send ( { cargo: 'A'.repeat ( 16 ) } );
        expect ( res.status ).toBe ( 400 );
    });

    describe ( 'ciclo de vida de um cargo', () =>
    {
        const CARGO_TESTE = { cargo: 'Técnico Teste' };
        let codCargoCriado: number;

        it ( 'POST cria o cargo com os valores enviados', async () =>
        {
            const res = await request ( app ).post ( '/api/cargos' ).send ( CARGO_TESTE );

            expect ( res.status ).toBe ( 201 );
            expect ( res.body.cargo ).toBe ( CARGO_TESTE.cargo );
            expect ( res.body.isActive ).toBe ( true );

            codCargoCriado = res.body.codCargo;
        });

        it ( 'GET /api/cargos/:id recupera o cargo recém-criado com os mesmos valores', async () =>
        {
            const res = await request ( app ).get ( `/api/cargos/${ codCargoCriado }` );

            expect ( res.status ).toBe ( 200 );
            expect ( res.body.cargo ).toBe ( CARGO_TESTE.cargo );
        });

        it ( 'DELETE /api/cargos/:id remove o cargo', async () =>
        {
            const res = await request ( app ).delete ( `/api/cargos/${ codCargoCriado }` );
            expect ( res.status ).toBe ( 204 );
        });

        it ( 'GET /api/cargos/:id após a remoção continua retornando o registro, inativo', async () =>
        {
            const res = await request ( app ).get ( `/api/cargos/${ codCargoCriado }` );
            expect ( res.status ).toBe ( 200 );
            expect ( res.body.isActive ).toBe ( false );
        });
    });
});
