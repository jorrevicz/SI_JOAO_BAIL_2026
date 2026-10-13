import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

// Testes de rota são de integração e comitam de verdade (sem rollback), então cada
// registro criado recebe um nome único.
function nomeUnico ( prefixo: string ): string
{
    return `${ prefixo } ${ Date.now() }${ Math.floor ( Math.random() * 1000 ) }`;
}

describe ( 'Produtos routes', () =>
{
    // O banco de teste começa vazio (ver src/db/testReset.ts, rodado no `pretest`), então
    // este arquivo não pode mais pegar as "duas primeiras" categorias do seed — ele cria
    // as próprias, mesmo padrão de funcionarios/servicos/contasPagamento (fixtures de
    // apoio criadas em beforeAll). Sem isso, o filtro por `codCategoria` também correria o
    // risco de herdar produtos de outros testes vinculados à mesma categoria.
    let primeiraCategoria: number;
    let segundaCategoria:  number;

    // Produtos e categorias criados pelos testes, para apagar em afterAll.
    const codigosProdutoCriados:   number[] = [];
    const codigosCategoriaCriados: number[] = [];

    beforeAll ( async () =>
    {
        // "categoria" não aceita dígitos (regex do schema) — nomeUnico() embute
        // timestamp/aleatório, então não serve aqui; o banco já começa vazio a cada
        // execução (testReset.ts no `pretest`), então nomes fixos não colidem.
        const primeira = await request ( app )
            .post ( '/api/categorias' )
            .send ( { categoria: 'CATEGORIA PRODUTOS TESTE A' } );
        const segunda = await request ( app )
            .post ( '/api/categorias' )
            .send ( { categoria: 'CATEGORIA PRODUTOS TESTE B' } );

        primeiraCategoria = primeira.body.codCategoria;
        segundaCategoria  = segunda.body.codCategoria;

        codigosCategoriaCriados.push ( primeiraCategoria, segundaCategoria );
    });

    afterAll ( async () =>
    {
        if ( codigosProdutoCriados.length > 0 )
        {
            await sql`DELETE FROM "ProdutoCategoria" WHERE "codProduto" IN ${ sql ( codigosProdutoCriados ) }`;
            await sql`DELETE FROM "Produtos" WHERE "codProd" IN ${ sql ( codigosProdutoCriados ) }`;
        }

        if ( codigosCategoriaCriados.length > 0 )
        {
            await sql`DELETE FROM "Categorias" WHERE "codCategoria" IN ${ sql ( codigosCategoriaCriados ) }`;
        }

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
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send ( { produto: 'A'.repeat ( 101 ), categorias: [ { codCategoria: primeiraCategoria } ] } );

        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/produtos cria produto e vínculos de categoria atomicamente', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO COM CATEGORIAS' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria }, { codCategoria: segundaCategoria } ],
            });

        expect ( res.status ).toBe ( 201 );
        expect ( res.body.codProd ).toBeDefined();
        codigosProdutoCriados.push ( res.body.codProd );

        const vinculosRes = await request ( app )
            .get ( `/api/produto-categorias?codProduto=${ res.body.codProd }` );

        expect ( vinculosRes.status ).toBe ( 200 );
        expect ( vinculosRes.body ).toHaveLength ( 2 );
    });

    it ( 'POST /api/produtos com peso bruto zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO PESO ZERO' ),
                undProduto: 'UN',
                pesoBruto:  0,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'pesoBruto' );
    });

    it ( 'POST /api/produtos com peso líquido zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO PESO LIQ ZERO' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'pesoLiq' );
    });

    it ( 'POST /api/produtos sem preço de venda retorna 400 no campo precoVenda', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO SEM PRECO' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'precoVenda' );
    });

    it ( 'POST /api/produtos com preço de venda zero retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO PRECO ZERO' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 0,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'precoVenda' );
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
        const res = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'CATEGORIA REPETIDA' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria }, { codCategoria: primeiraCategoria } ],
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
        const criadoRes = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO A RECONCILIAR' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( criadoRes.status ).toBe ( 201 );
        const codProd = criadoRes.body.codProd;
        codigosProdutoCriados.push ( codProd );

        // Troca a categoria: a primeira sai, a segunda entra
        const atualizadoRes = await request ( app )
            .put ( `/api/produtos/${ codProd }` )
            .send
            ({
                produto:    criadoRes.body.produto,
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                precoVenda: 10,
                isActive:   true,
                categorias: [ { codCategoria: segundaCategoria } ],
            });

        expect ( atualizadoRes.status ).toBe ( 200 );

        const vinculosRes = await request ( app )
            .get ( `/api/produto-categorias?codProduto=${ codProd }` );

        expect ( vinculosRes.body ).toHaveLength ( 1 );
        expect ( vinculosRes.body[ 0 ].codCategoria ).toBe ( segundaCategoria );
    });

    it ( 'GET /api/produtos?codCategoria=N filtra pela associativa', async () =>
    {
        const criadoRes = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO FILTRADO' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria: primeiraCategoria } ],
            });

        expect ( criadoRes.status ).toBe ( 201 );
        codigosProdutoCriados.push ( criadoRes.body.codProd );

        const filtradosRes = await request ( app )
            .get ( `/api/produtos?codCategoria=${ primeiraCategoria }&limit=100` );

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
        codigosCategoriaCriados.push ( codCategoria );

        const produtoRes = await request ( app )
            .post ( '/api/produtos' )
            .send
            ({
                produto:    nomeUnico ( 'PRODUTO QUE OCUPA' ),
                undProduto: 'UN',
                pesoBruto:  1,
                pesoLiq:    0.9,
                estoque:    0,
                custoProd:  0,
                precoVenda: 10,
                categorias: [ { codCategoria } ],
            });

        expect ( produtoRes.status ).toBe ( 201 );
        codigosProdutoCriados.push ( produtoRes.body.codProd );

        const res = await request ( app ).delete ( `/api/categorias/${ codCategoria }` );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body.mensagem ).toBeDefined();
    });
});
