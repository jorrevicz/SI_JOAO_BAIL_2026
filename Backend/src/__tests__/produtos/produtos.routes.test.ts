import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

// Testes de rota são de integração e comitam de verdade (sem rollback), então cada
// registro criado recebe um nome único.
function nomeUnico ( prefixo: string ): string
{
    return `${ prefixo } ${ Date.now() }${ Math.floor ( Math.random() * 1000 ) }`;
}

async function obterDuasCategorias (): Promise < number[] >
{
    const resposta = await request ( app ).get ( '/api/categorias' );

    return resposta.body
        .slice ( 0, 2 )
        .map ( ( categoria: { codCategoria: number } ) => categoria.codCategoria );
}

describe ( 'Produtos routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/produtos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/produtos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/produtos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/produtos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/produtos com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/produtos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produtos com nome muito longo retorna 400', async () =>
    {
        const [ codCategoria ] = await obterDuasCategorias();

        const res = await request ( app )
            .post ( '/api/produtos' )
            .send ( { produto: 'A'.repeat ( 101 ), categorias: [ { codCategoria } ] } );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produtos cria produto e vínculos de categoria atomicamente', async () =>
    {
        const [ primeira, segunda ] = await obterDuasCategorias();

        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO COM CATEGORIAS' ),
                undProduto: 'UN',
                categorias: [ { codCategoria: primeira }, { codCategoria: segunda } ],
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body.codProd ).toBeDefined();

        const vinculosRes = await request ( app )
            .get ( `/api/produto-categorias?codProduto=${ res.body.codProd }` );

        expect ( vinculosRes.status ).toBe ( 200 );
        expect ( vinculosRes.body ).toHaveLength ( 2 );
    });

    it ( 'POST /api/produtos sem categorias retorna 400 (RN: ao menos uma categoria)', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send ( { produto: nomeUnico ( 'SEM CATEGORIAS' ) } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.categorias ).toBeDefined();
    });

    it ( 'POST /api/produtos com array de categorias vazio retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send ( { produto: nomeUnico ( 'ARRAY VAZIO' ), categorias: [] } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.categorias ).toBeDefined();
    });

    it ( 'POST /api/produtos com categoria repetida retorna 400, não 500', async () =>
    {
        const [ codCategoria ] = await obterDuasCategorias();

        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'CATEGORIA REPETIDA' ),
                categorias: [ { codCategoria }, { codCategoria } ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros?.categorias ).toBeDefined();
    });

    it ( 'POST /api/produtos com categoria inexistente retorna 400 e não persiste nada', async () =>
    {
        const antes = await request ( app ).get ( '/api/produtos?limit=100' );
        const quantidadeAntes = antes.body.length;

        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'CATEGORIA INEXISTENTE' ),
                categorias: [ { codCategoria: 999999 } ],
            });

        expect ( res.status ).toBe ( 400 );

        const depois = await request ( app ).get ( '/api/produtos?limit=100' );
        expect ( depois.body.length ).toBe ( quantidadeAntes );
    });

    it ( 'PUT /api/produtos/:id reconcilia a lista de categorias', async () =>
    {
        const [ primeira, segunda ] = await obterDuasCategorias();

        const criadoRes = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO A RECONCILIAR' ),
                categorias: [ { codCategoria: primeira } ],
            });

        expect ( criadoRes.status ).toBe ( 201 );
        const codProd = criadoRes.body.codProd;

        // Troca a categoria: a primeira sai, a segunda entra
        const atualizadoRes = await request ( app )
            .put ( `/api/produtos/${ codProd }` )
            .send
            ({
                produto:    criadoRes.body.produto,
                isActive:   true,
                categorias: [ { codCategoria: segunda } ],
            });

        expect ( atualizadoRes.status ).toBe ( 200 );

        const vinculosRes = await request ( app )
            .get ( `/api/produto-categorias?codProduto=${ codProd }` );

        expect ( vinculosRes.body ).toHaveLength ( 1 );
        expect ( vinculosRes.body[ 0 ].codCategoria ).toBe ( segunda );
    });

    it ( 'GET /api/produtos?codCategoria=N filtra pela associativa', async () =>
    {
        const [ primeira ] = await obterDuasCategorias();

        const criadoRes = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO FILTRADO' ),
                categorias: [ { codCategoria: primeira } ],
            });

        const filtradosRes = await request ( app )
            .get ( `/api/produtos?codCategoria=${ primeira }&limit=100` );

        expect ( filtradosRes.status ).toBe ( 200 );
        expect ( filtradosRes.body.map ( ( produto: { codProd: number } ) => produto.codProd ) )
            .toContain ( criadoRes.body.codProd );
    });

    it ( 'DELETE /api/categorias/:id vinculada a produto ativo retorna 409 (RN002)', async () =>
    {
        const categoriaRes = await request ( app )
            .post ( '/api/categorias' )
            .send ( { categoria: nomeUnico ( 'CATEGORIA OCUPADA' ).replace ( /\d/g, '' ) } );

        expect ( categoriaRes.status ).toBe ( 201 );
        const codCategoria = categoriaRes.body.codCategoria;

        await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO QUE OCUPA' ),
                categorias: [ { codCategoria } ],
            });

        const res = await request ( app ).delete ( `/api/categorias/${ codCategoria }` );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body.mensagem ).toBeDefined();
    });
});
