import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'CondicoesPagamento routes', () =>
{
    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/condicoes-pagamento retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/condicoes-pagamento' );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/condicoes-pagamento/:id inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( '/api/condicoes-pagamento/999999' );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/condicoes-pagamento com payload inválido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ( {} );

        expect ( res.status ).toBe ( 400 );
    });

    // RN003 — a condição deve ter ao menos uma parcela
    it ( 'POST /api/condicoes-pagamento sem parcelas retorna 400 (RN003)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ( { descricao: 'Sem Parcelas', isActive: true } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN003 — array vazio também é inválido
    it ( 'POST /api/condicoes-pagamento com parcelas vazio retorna 400 (RN003)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ( { descricao: 'Parcelas Vazias', isActive: true, parcelas: [] } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN006 — soma dos percentuais deve ser 100%
    it ( 'POST /api/condicoes-pagamento com soma de percentuais ≠ 100 retorna 400 (RN006)', async () =>
    {
        const formasRes = await request ( app ).get ( '/api/formas-pagamento' );
        const codFormaDePag = formasRes.body[ 0 ].codFormaDePag;

        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Soma Errada',
                isActive:  true,
                parcelas:  [
                    { codFormaDePag, percentual: 40, numDias: 30, isActive: true },
                    { codFormaDePag, percentual: 40, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN004 — dias estritamente crescentes
    it ( 'POST /api/condicoes-pagamento com numDias repetidos retorna 400 (RN004)', async () =>
    {
        const formasRes = await request ( app ).get ( '/api/formas-pagamento' );
        const codFormaDePag = formasRes.body[ 0 ].codFormaDePag;

        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Dias Repetidos',
                isActive:  true,
                parcelas:  [
                    { codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN005 — numDias mínimo é 1 (0 não permitido)
    it ( 'POST /api/condicoes-pagamento com numDias = 0 retorna 400 (RN005)', async () =>
    {
        const formasRes = await request ( app ).get ( '/api/formas-pagamento' );
        const codFormaDePag = formasRes.body[ 0 ].codFormaDePag;

        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Dia Zero',
                isActive:  true,
                parcelas:  [ { codFormaDePag, percentual: 100, numDias: 0, isActive: true } ],
            });

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/condicoes-pagamento com parcelas cria condição e parcelas atomicamente', async () =>
    {
        const formasRes = await request ( app ).get ( '/api/formas-pagamento' );
        const codFormaDePag = formasRes.body[ 0 ].codFormaDePag;

        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Teste com Parcelas',
                isActive:  true,
                parcelas:  [
                    { codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body.codCondDePag ).toBeDefined();

        const parcelasRes = await request ( app )
            .get ( `/api/parcelas?codCondDePag=${ res.body.codCondDePag }` );

        expect ( parcelasRes.status ).toBe ( 200 );
        expect ( parcelasRes.body ).toHaveLength ( 2 );
    });

    it ( 'POST /api/condicoes-pagamento com codFormaDePag inválido retorna 400 e não persiste nada', async () =>
    {
        const antes = await request ( app ).get ( '/api/condicoes-pagamento' );
        const quantidadeAntes = antes.body.length;

        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Rollback Test',
                isActive:  true,
                parcelas:  [ { codFormaDePag: 999999, percentual: 100, numDias: 1, isActive: true } ],
            });

        expect ( res.status ).toBe ( 400 );

        const depois = await request ( app ).get ( '/api/condicoes-pagamento' );
        expect ( depois.body.length ).toBe ( quantidadeAntes );
    });

    it ( 'PUT /api/condicoes-pagamento/:id reconcilia parcelas', async () =>
    {
        const formasRes = await request ( app ).get ( '/api/formas-pagamento' );
        const codFormaDePag = formasRes.body[ 0 ].codFormaDePag;

        const criadaRes = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Para Atualizar',
                isActive:  true,
                parcelas:  [ { codFormaDePag, percentual: 100, numDias: 30, isActive: true } ],
            });

        expect ( criadaRes.status ).toBe ( 201 );
        const codCondDePag = criadaRes.body.codCondDePag;

        const parcelasAntes = await request ( app )
            .get ( `/api/parcelas?codCondDePag=${ codCondDePag }` );

        const codParcelaExistente = parcelasAntes.body[ 0 ].codParcela;

        const atualizadaRes = await request ( app )
            .put ( `/api/condicoes-pagamento/${ codCondDePag }` )
            .send ({
                descricao: 'Atualizada',
                isActive:  true,
                parcelas:  [
                    { codParcela: codParcelaExistente, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( atualizadaRes.status ).toBe ( 200 );

        const parcelasDepois = await request ( app )
            .get ( `/api/parcelas?codCondDePag=${ codCondDePag }` );

        expect ( parcelasDepois.body ).toHaveLength ( 2 );
    });
});
