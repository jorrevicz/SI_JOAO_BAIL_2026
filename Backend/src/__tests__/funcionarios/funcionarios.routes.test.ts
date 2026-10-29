import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

// Estas rotas gravam no banco real (sem rollback). Usamos identificadores fixos e
// limpamos qualquer resquício de execuções anteriores antes de começar, e os registros
// de apoio (País/Estado/Cidade/Cargo) ao final — deixando o banco vazio destes dados
// de teste antes e depois do ciclo de vida.
const PAIS_TESTE   = { pais: 'Teste', sigla: 'TS', ddi: '900', moeda: 'BRL' };
const CARGO_TESTE  = { cargo: 'Téc. Teste' };

describe ( 'Funcionarios routes', () =>
{
    let codPais:    number;
    let codEstado:  number;
    let codCidade:  number;
    let codCargo:   number;

    beforeAll ( async () =>
    {
        await sql`DELETE FROM "Funcionarios" WHERE "funcFone" = '19911111111'`;
        await sql`DELETE FROM "Cargos" WHERE "cargo" = ${ CARGO_TESTE.cargo }`;
        await sql`DELETE FROM "Cidades" WHERE "cidade" = 'Campinas Teste'`;
        await sql`DELETE FROM "Estados" WHERE "estado" = 'SP Teste'`;
        await sql`DELETE FROM "Paises" WHERE "sigla" = ${ PAIS_TESTE.sigla }`;

        const pais = await request ( app ).post ( '/api/paises' ).send ( PAIS_TESTE );
        const estado = await request ( app )
            .post ( '/api/estados' )
            .send ( { codPais: pais.body.codPais, uf: 'SP', estado: 'SP Teste' } );
        const cidade = await request ( app )
            .post ( '/api/cidades' )
            .send ( { codEstado: estado.body.codEstado, cidade: 'Campinas Teste', ddd: '19' } );
        const cargo = await request ( app ).post ( '/api/cargos' ).send ( CARGO_TESTE );

        codPais   = pais.body.codPais;
        codEstado = estado.body.codEstado;
        codCidade = cidade.body.codCidade;
        codCargo  = cargo.body.codCargo;
    });

    afterAll ( async () =>
    {
        // DELETE (não soft delete) do funcionário do ciclo de vida — ele fica com
        // isActive=false após o teste de remoção, mas a linha continua existindo e
        // bloquearia a exclusão do Cargo/Cidade por FK.
        await sql`DELETE FROM "Funcionarios" WHERE "funcFone" = '19911111111'`;
        await sql`DELETE FROM "Cargos" WHERE "codCargo" = ${ codCargo }`;
        await sql`DELETE FROM "Cidades" WHERE "codCidade" = ${ codCidade }`;
        await sql`DELETE FROM "Estados" WHERE "codEstado" = ${ codEstado }`;
        await sql`DELETE FROM "Paises" WHERE "codPais" = ${ codPais }`;

        await sql.end();
    });

    it ( 'GET /api/funcionarios retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/funcionarios' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/funcionarios/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/funcionarios/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/funcionarios com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/funcionarios' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/funcionarios com telefone fora do formato retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/funcionarios' )
            .send ( { codCidade, codCargo, funcionario: 'Ana Silva', funcFone: '123' } );
        expect ( res.status ).toBe ( 400 );
    });

    describe ( 'ciclo de vida de um funcionário', () =>
    {
        let FUNCIONARIO_TESTE: { codCidade: number; codCargo: number; funcionario: string; funcFone: string };
        let codFuncionarioCriado: number;

        it ( 'POST cria o funcionário com os valores enviados', async () =>
        {
            FUNCIONARIO_TESTE = { codCidade, codCargo, funcionario: 'Ana Silva', funcFone: '19911111111' };

            const res = await request ( app ).post ( '/api/funcionarios' ).send ( FUNCIONARIO_TESTE );

            expect ( res.status ).toBe ( 201 );
            expect ( res.body ).toMatchObject ( FUNCIONARIO_TESTE );
            expect ( res.body.isActive ).toBe ( true );

            codFuncionarioCriado = res.body.codFuncionario;
        });

        it ( 'GET /api/funcionarios/:id recupera o funcionário recém-criado com os mesmos valores', async () =>
        {
            const res = await request ( app ).get ( `/api/funcionarios/${ codFuncionarioCriado }` );

            expect ( res.status ).toBe ( 200 );
            expect ( res.body ).toMatchObject ( FUNCIONARIO_TESTE );
        });

        it ( 'DELETE /api/funcionarios/:id remove o funcionário', async () =>
        {
            const res = await request ( app ).delete ( `/api/funcionarios/${ codFuncionarioCriado }` );
            expect ( res.status ).toBe ( 204 );
        });

        it ( 'GET /api/funcionarios/:id após a remoção continua retornando o registro, inativo', async () =>
        {
            const res = await request ( app ).get ( `/api/funcionarios/${ codFuncionarioCriado }` );
            expect ( res.status ).toBe ( 200 );
            expect ( res.body.isActive ).toBe ( false );
        });
    });
});
