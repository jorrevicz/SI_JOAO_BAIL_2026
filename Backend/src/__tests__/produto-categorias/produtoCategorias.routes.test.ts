import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

const BASE = '/api/produto-categorias';

describe ( 'ProdutoCategorias routes', () =>
{
    let codProduto:     number;
    let codCategoria:   number;
    let outraCategoria: number;

    beforeAll ( async () =>
    {
        const [ produto ] = await sql < { codProd: number }[] >`
            INSERT INTO "Produtos" ( "produto", "undProduto", "pesoBruto", "pesoLiq", "codUser" )
            VALUES ( 'PRODUTO ROTA PC', 'UN', 1, 0.9, 1 )
            RETURNING "codProd"
        `;
        codProduto = produto.codProd;

        const [ categoria ] = await sql < { codCategoria: number }[] >`
            INSERT INTO "Categorias" ( "categoria", "codUser" )
            VALUES ( 'CATEGORIA ROTA PC', 1 )
            RETURNING "codCategoria"
        `;
        codCategoria = categoria.codCategoria;

        const [ segunda ] = await sql < { codCategoria: number }[] >`
            INSERT INTO "Categorias" ( "categoria", "codUser" )
            VALUES ( 'CATEGORIA ROTA PC SEGUNDA', 1 )
            RETURNING "codCategoria"
        `;
        outraCategoria = segunda.codCategoria;
    });

    afterAll ( async () => { await sql.end(); } );

    it ( 'GET /api/produto-categorias retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( BASE );

        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'POST /api/produto-categorias com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( {} );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produto-categorias com produto inexistente retorna 400', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( { codProduto: 999999, codCategoria } );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produto-categorias cria o vínculo e GET ?codProduto= filtra por ele', async () =>
    {
        const criado = await request ( app ).post ( BASE ).send ( { codProduto, codCategoria } );

        expect ( criado.status ).toBe ( 201 );
        expect ( criado.body ).toMatchObject ( { codProduto, codCategoria } );

        const listado = await request ( app ).get ( `${ BASE }?codProduto=${ codProduto }` );

        expect ( listado.status ).toBe ( 200 );
        expect ( listado.body ).toEqual
        ([
            { codProduto, codCategoria, categoria: 'CATEGORIA ROTA PC' },
        ]);
    });

    it ( 'POST /api/produto-categorias com vínculo repetido retorna 409', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( { codProduto, codCategoria } );

        expect ( res.status ).toBe ( 409 );
    });

    it ( 'DELETE /api/produto-categorias/:codProduto/:codCategoria remove o vínculo', async () =>
    {
        await request ( app ).post ( BASE ).send ( { codProduto, codCategoria: outraCategoria } );

        const removido = await request ( app ).delete ( `${ BASE }/${ codProduto }/${ outraCategoria }` );

        expect ( removido.status ).toBe ( 204 );

        const listado = await request ( app ).get ( `${ BASE }?codProduto=${ codProduto }` );

        expect ( listado.body.some ( ( vinculo: { codCategoria: number } ) => vinculo.codCategoria === outraCategoria ) )
            .toBe ( false );
    });

    it ( 'DELETE /api/produto-categorias/:codProduto/:codCategoria inexistente retorna 404', async () =>
    {
        const res = await request ( app ).delete ( `${ BASE }/${ codProduto }/999999` );

        expect ( res.status ).toBe ( 404 );
    });
});
