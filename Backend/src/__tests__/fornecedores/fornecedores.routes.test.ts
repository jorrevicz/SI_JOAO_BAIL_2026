import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

describe ( 'Fornecedores routes', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'GET /api/fornecedores retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/fornecedores' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/fornecedores/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/fornecedores/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/fornecedores sem payload obrigatório retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/fornecedores' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/fornecedores com nome muito longo retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ( { codCidade: 1, fornecedor: 'A'.repeat ( 129 ) } );
        expect ( res.status ).toBe ( 400 );
    });

    it.each ( [ 0, -5, 12.5, '125', 1000000 ] )
    ( 'POST /api/fornecedores com número residencial inválido (%s) retorna 400', async ( numeroForn ) =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ({
                codCidade: 1, codCondDePag: 1, fornecedor: 'Fornecedor Teste', tipoPessoa: 'JURIDICA', numeroForn,
                cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numeroForn' );
    });

    it ( 'POST /api/fornecedores com CEP zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ({
                codCidade: 1, codCondDePag: 1, fornecedor: 'Fornecedor Teste', tipoPessoa: 'JURIDICA',
                cepForn: '00000000', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'cepForn' );
    });

    it ( 'POST /api/fornecedores com telefone zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ({
                codCidade: 1, codCondDePag: 1, fornecedor: 'Fornecedor Teste', tipoPessoa: 'JURIDICA',
                cepForn: '01310100', foneForn: '0000000000',
                cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'foneForn' );
    });

    it ( 'POST /api/fornecedores com CPF/CNPJ zero-preenchido retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/fornecedores' )
            .send ({
                codCidade: 1, codCondDePag: 1, fornecedor: 'Fornecedor Teste', tipoPessoa: 'JURIDICA',
                cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                cpfCnpjForn: '00000000000000', inscEstSubTrib: '111111111111',
            });
        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'cpfCnpjForn' );
    });

    describe ( 'dados pessoais por tipo de pessoa', () =>
    {
        const base =
        {
            codCidade: 1, codCondDePag: 1, fornecedor: 'Fornecedor Teste', cepForn: '01310100',
            foneForn: '551133331111', email: 'teste@kaneko.com.br',
            cpfCnpjForn: '12345678000190', inscEstSubTrib: '111111111111',
        };

        // Os campos do tipo de pessoa são anuláveis: ausentes, não geram erro. O CEP zerado
        // força um 400 só para o teste não gravar nada e poder inspecionar os erros.
        it ( 'pessoa jurídica sem nome fantasia e data de fundação não acusa esses campos', async () =>
        {
            const res = await request ( app )
                .post ( '/api/fornecedores' )
                .send ( { ...base, tipoPessoa: 'JURIDICA', cepForn: '00000000', nomeFantasia: null, dtFundacao: null } );
            expect ( res.status ).toBe ( 400 );
            expect ( Object.keys ( res.body.erros ) ).toEqual ( [ 'cepForn' ] );
        });

        it ( 'pessoa física sem apelido, RG, data de nascimento e gênero não acusa esses campos', async () =>
        {
            const res = await request ( app )
                .post ( '/api/fornecedores' )
                .send ( { ...base, tipoPessoa: 'FISICA', cepForn: '00000000', apelido: null, rg: null, dtNascimento: null, genero: null } );
            expect ( res.status ).toBe ( 400 );
            expect ( Object.keys ( res.body.erros ) ).toEqual ( [ 'cepForn' ] );
        });

        it ( 'e-mail ausente retorna 400', async () =>
        {
            const res = await request ( app )
                .post ( '/api/fornecedores' )
                .send ( { ...base, email: undefined, tipoPessoa: 'JURIDICA', dtFundacao: '2010-03-01' } );
            expect ( res.status ).toBe ( 400 );
            expect ( res.body.erros ).toHaveProperty ( 'email' );
        });
    });
});
