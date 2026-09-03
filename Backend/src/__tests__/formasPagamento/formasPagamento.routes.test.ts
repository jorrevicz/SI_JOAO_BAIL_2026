import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'FormasPagamento routes', () =>
{
    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/formas-pagamento retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/formas-pagamento' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/formas-pagamento/:id inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( '/api/formas-pagamento/999999' );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/formas-pagamento com payload inválido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/formas-pagamento' )
            .send ( {} );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/formas-pagamento cria e retorna 201', async () =>
    {
        const res = await request ( app )
            .post ( '/api/formas-pagamento' )
            .send ( { formaDePag: 'Teste Rota', prazoCompensacao: 1 } );

        expect ( res.status ).toBe ( 201 );
        expect ( res.body.codFormaDePag ).toBeDefined();
        expect ( res.body.formaDePag ).toBe ( 'Teste Rota' );
    });
});
