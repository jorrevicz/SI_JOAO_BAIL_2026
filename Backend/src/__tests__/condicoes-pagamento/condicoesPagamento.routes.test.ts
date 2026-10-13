import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

const FORMA_DE_PAG_TESTE = { formaDePag: 'Boleto Teste CondPag', prazoCompensacao: 1 };

describe ( 'CondicoesPagamento routes', () =>
{
    // A condição de pagamento não tem forma de pagamento própria — cada parcela aponta
    // para uma FormaDePagamento. Como o banco de teste agora começa vazio (ver
    // src/db/testReset.ts, rodado no `pretest`), este arquivo não pode mais pegar a
    // "primeira" forma de pagamento do seed: ele cria a própria, mesmo padrão de
    // funcionarios/servicos/contasPagamento (fixtures de apoio criadas em beforeAll).
    let codFormaDePag: number;

    // Toda condição de pagamento criada pelos testes, para apagar em afterAll — as
    // parcelas (FK RESTRICT para CondicaoDePagamento) são apagadas primeiro.
    const codigosCondicaoCriados: number[] = [];

    beforeAll ( async () =>
    {
        const formaDePag = await request ( app ).post ( '/api/formas-pagamento' ).send ( FORMA_DE_PAG_TESTE );
        codFormaDePag = formaDePag.body.codFormaDePag;
    });

    afterAll ( async () =>
    {
        if ( codigosCondicaoCriados.length > 0 )
        {
            await sql`DELETE FROM "Parcelas" WHERE "codCondDePag" IN ${ sql ( codigosCondicaoCriados ) }`;
            await sql`DELETE FROM "CondicaoDePagamento" WHERE "codCondDePag" IN ${ sql ( codigosCondicaoCriados ) }`;
        }

        await sql`DELETE FROM "FormaDePagamento" WHERE "codFormaDePag" = ${ codFormaDePag }`;

        await sql.end();
    });

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
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Soma Errada',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [
                    { numParcela: 1, codFormaDePag, percentual: 40, numDias: 30, isActive: true },
                    { numParcela: 2, codFormaDePag, percentual: 40, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN004 — dias estritamente crescentes
    it ( 'POST /api/condicoes-pagamento com numDias repetidos retorna 400 (RN004)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Dias Repetidos',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [
                    { numParcela: 1, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { numParcela: 2, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // RN005 — numDias mínimo é 1 (0 não permitido)
    it ( 'POST /api/condicoes-pagamento com numDias = 0 retorna 400 (RN005)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Dia Zero',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag, percentual: 100, numDias: 0, isActive: true } ],
            });

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/condicoes-pagamento com parcelas cria condição e parcelas atomicamente', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Teste com Parcelas',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [
                    { numParcela: 1, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { numParcela: 2, codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body.codCondDePag ).toBeDefined();
        codigosCondicaoCriados.push ( res.body.codCondDePag );

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
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag: 999999, percentual: 100, numDias: 1, isActive: true } ],
            });

        expect ( res.status ).toBe ( 400 );

        const depois = await request ( app ).get ( '/api/condicoes-pagamento' );
        expect ( depois.body.length ).toBe ( quantidadeAntes );
    });

    it ( 'PUT /api/condicoes-pagamento/:id reconcilia parcelas', async () =>
    {
        const criadaRes = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Para Atualizar',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [ { numParcela: 1, codFormaDePag, percentual: 100, numDias: 30, isActive: true } ],
            });

        expect ( criadaRes.status ).toBe ( 201 );
        const codCondDePag = criadaRes.body.codCondDePag;
        codigosCondicaoCriados.push ( codCondDePag );

        const parcelasAntes = await request ( app )
            .get ( `/api/parcelas?codCondDePag=${ codCondDePag }` );

        const numParcelaExistente = parcelasAntes.body[ 0 ].numParcela;

        const atualizadaRes = await request ( app )
            .put ( `/api/condicoes-pagamento/${ codCondDePag }` )
            .send ({
                descricao: 'Atualizada',
                isActive:  true,
                parcelas:  [
                    { numParcela: numParcelaExistente, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { numParcela: 2, codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( atualizadaRes.status ).toBe ( 200 );

        const parcelasDepois = await request ( app )
            .get ( `/api/parcelas?codCondDePag=${ codCondDePag }` );

        expect ( parcelasDepois.body ).toHaveLength ( 2 );
    });

    // Código manual: números não precisam ser informados em ordem, mas não podem repetir
    it ( 'POST /api/condicoes-pagamento com numParcela repetido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Número Repetido',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [
                    { numParcela: 1, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { numParcela: 1, codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    // Os dias seguem a ordem do número da parcela, não a ordem da lista
    it ( 'POST /api/condicoes-pagamento com dias menores na parcela de número maior retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Dias Invertidos',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [
                    { numParcela: 2, codFormaDePag, percentual: 50, numDias: 30, isActive: true },
                    { numParcela: 1, codFormaDePag, percentual: 50, numDias: 60, isActive: true },
                ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.parcelas ).toBeDefined();
    });

    it ( 'POST /api/condicoes-pagamento sem numParcela retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/condicoes-pagamento' )
            .send ({
                descricao: 'Sem Número',
                juroCondPag: 0, multaCondPag: 0, descontoCondPag: 0,
                isActive:  true,
                parcelas:  [ { codFormaDePag, percentual: 100, numDias: 30, isActive: true } ],
            });

        expect ( res.status ).toBe ( 400 );
    });
});
