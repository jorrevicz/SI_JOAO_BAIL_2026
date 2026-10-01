import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Clientes routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/clientes retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/clientes' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/clientes/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/clientes/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/clientes sem payload obrigatório retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/clientes' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/clientes com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/clientes' )
            .send ( { codCidade: 1, cliente: 'A'.repeat ( 129 ) } );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/clientes com CEP zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/clientes' )
            .send ({
                codCidade: 1, cliente: 'Cliente Teste', tipoPessoa: 'FISICA',
                cepCl: '00000000', foneCl: '5511988887777',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'cepCl' );
    });

    it ( 'POST /api/clientes com telefone zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/clientes' )
            .send ({
                codCidade: 1, cliente: 'Cliente Teste', tipoPessoa: 'FISICA',
                cepCl: '20511120', foneCl: '0000000000',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'foneCl' );
    });

    describe ( 'dados pessoais por tipo de pessoa', () =>
    {
        const base =
        {
            codCidade: 1, cliente: 'Cliente Teste', cepCl: '20511120',
            foneCl: '5521988887777', email: 'teste@kaneko.com.br',
        };

        it ( 'pessoa física sem data de nascimento e gênero retorna 400', async () =>
        {
            const res = await request ( app ).post ( '/api/clientes' ).send ( { ...base, tipoPessoa: 'FISICA' } );
            expect ( res.status ).toBe ( 400 );
            expect ( res.body.erros ).toHaveProperty ( 'dtNascimento' );
            expect ( res.body.erros ).toHaveProperty ( 'genero' );
        });

        it ( 'pessoa jurídica sem data de fundação retorna 400', async () =>
        {
            const res = await request ( app ).post ( '/api/clientes' ).send ( { ...base, tipoPessoa: 'JURIDICA' } );
            expect ( res.status ).toBe ( 400 );
            expect ( res.body.erros ).toHaveProperty ( 'dtFundacao' );
        });

        it ( 'data de nascimento no futuro retorna 400', async () =>
        {
            const res = await request ( app )
                .post ( '/api/clientes' )
                .send ( { ...base, tipoPessoa: 'FISICA', genero: 'OUTRO', dtNascimento: '2999-01-01' } );
            expect ( res.status ).toBe ( 400 );
            expect ( res.body.erros ).toHaveProperty ( 'dtNascimento' );
        });

        it ( 'e-mail inválido e telefone fixo inválido retornam 400', async () =>
        {
            const res = await request ( app )
                .post ( '/api/clientes' )
                .send ( {
                    ...base, tipoPessoa: 'JURIDICA', dtFundacao: '2010-03-01',
                    email: 'sem-arroba', foneFixo: '123',
                } );
            expect ( res.status ).toBe ( 400 );
            expect ( res.body.erros ).toHaveProperty ( 'email' );
            expect ( res.body.erros ).toHaveProperty ( 'foneFixo' );
        });
    });
});
