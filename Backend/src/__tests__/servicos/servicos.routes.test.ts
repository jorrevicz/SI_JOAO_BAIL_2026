import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

// Estas rotas gravam no banco real (sem rollback). Usamos identificadores fixos e
// limpamos qualquer resquício de execuções anteriores antes de começar, e os registros
// de apoio (País/Estado/Cidade/Cargo/Funcionário) ao final — deixando o banco vazio
// destes dados de teste antes e depois do ciclo de vida.
const PAIS_TESTE  = { pais: 'Teste', sigla: 'TC', ddi: '901', moeda: 'BRL' };
const CARGO_TESTE = { cargo: 'Téc. Teste' };

describe ( 'Servicos routes', () =>
{
    let codPais:        number;
    let codEstado:      number;
    let codCidade:      number;
    let codCargo:       number;
    let codFuncionario: number;

    beforeAll ( async () =>
    {
        await sql`DELETE FROM "Servicos" WHERE "servico" = 'Formatação Teste'`;
        await sql`DELETE FROM "Funcionarios" WHERE "funcFone" = '19999999999'`;
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
        const funcionario = await request ( app )
            .post ( '/api/funcionarios' )
            .send ( { codCidade: cidade.body.codCidade, codCargo: cargo.body.codCargo, funcionario: 'Ana Silva', funcFone: '19999999999' } );

        codPais        = pais.body.codPais;
        codEstado      = estado.body.codEstado;
        codCidade      = cidade.body.codCidade;
        codCargo       = cargo.body.codCargo;
        codFuncionario = funcionario.body.codFuncionario;
    });

    afterAll ( async () =>
    {
        // DELETE (não soft delete) do serviço do ciclo de vida — ele fica com
        // isActive=false após o teste de remoção, mas a linha continua existindo e
        // bloquearia a exclusão do Funcionário por FK.
        await sql`DELETE FROM "Servicos" WHERE "servico" = 'Formatação Teste'`;
        await sql`DELETE FROM "Funcionarios" WHERE "codFuncionario" = ${ codFuncionario }`;
        await sql`DELETE FROM "Cargos" WHERE "codCargo" = ${ codCargo }`;
        await sql`DELETE FROM "Cidades" WHERE "codCidade" = ${ codCidade }`;
        await sql`DELETE FROM "Estados" WHERE "codEstado" = ${ codEstado }`;
        await sql`DELETE FROM "Paises" WHERE "codPais" = ${ codPais }`;

        await sql.end();
    });

    it ( 'GET /api/servicos retorna 200 e um array', async () =>
    {
        const res = await request ( app ).get ( '/api/servicos' );
        expect ( res.status ).toBe ( 200 );
        expect ( Array.isArray ( res.body ) ).toBe ( true );
    });

    it ( 'GET /api/servicos/:id inexistente retorna 404 com mensagem PT', async () =>
    {
        const res = await request ( app ).get ( '/api/servicos/999999' );
        expect ( res.status ).toBe ( 404 );
        expect ( res.body.mensagem ).toBeDefined();
    });

    it ( 'POST /api/servicos com payload inválido retorna 400', async () =>
    {
        const res = await request ( app ).post ( '/api/servicos' ).send ( {} );
        expect ( res.status ).toBe ( 400 );
    });

    it ( 'POST /api/servicos com valor fora do formato decimal retorna 400', async () =>
    {
        const res = await request ( app )
            .post ( '/api/servicos' )
            .send ( { servico: 'Formatação', valor: '150', codFuncionario } );
        expect ( res.status ).toBe ( 400 );
    });

    describe ( 'ciclo de vida de um serviço', () =>
    {
        let SERVICO_TESTE: { servico: string; valor: string; codFuncionario: number };
        let codServicoCriado: number;

        it ( 'POST cria o serviço com os valores enviados', async () =>
        {
            SERVICO_TESTE = { servico: 'Formatação Teste', valor: '150.00', codFuncionario };

            const res = await request ( app ).post ( '/api/servicos' ).send ( SERVICO_TESTE );

            expect ( res.status ).toBe ( 201 );
            expect ( res.body ).toMatchObject ( SERVICO_TESTE );
            expect ( res.body.isActive ).toBe ( true );

            codServicoCriado = res.body.codServico;
        });

        it ( 'GET /api/servicos/:id recupera o serviço recém-criado com os mesmos valores', async () =>
        {
            const res = await request ( app ).get ( `/api/servicos/${ codServicoCriado }` );

            expect ( res.status ).toBe ( 200 );
            expect ( res.body ).toMatchObject ( SERVICO_TESTE );
        });

        it ( 'DELETE /api/servicos/:id remove o serviço', async () =>
        {
            const res = await request ( app ).delete ( `/api/servicos/${ codServicoCriado }` );
            expect ( res.status ).toBe ( 204 );
        });

        it ( 'GET /api/servicos/:id após a remoção retorna 404', async () =>
        {
            const res = await request ( app ).get ( `/api/servicos/${ codServicoCriado }` );
            expect ( res.status ).toBe ( 404 );
        });
    });
});
