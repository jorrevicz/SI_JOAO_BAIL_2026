import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste, criarCondicaoDePagamentoDeTeste } from '../helpers/fixtures';
import { FornecedoresRepository } from '../../modules/fornecedores/fornecedores.repository';

const repo = new FornecedoresRepository();

describe ( 'FornecedoresRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade     = await criarCidadeDeTeste ( transaction );
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, codCondDePag, fornecedor: 'Distribuidora Teste Ltda',
                    tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                    cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
                },
                1,
                transaction
            );

            expect ( novo.codForn ).toBeDefined();
            expect ( novo.fornecedor ).toBe ( 'Distribuidora Teste Ltda' );

            const achado = await repo.FindById ( novo.codForn, transaction );
            expect ( achado?.fornecedor ).toBe ( 'Distribuidora Teste Ltda' );
        });
    });

    it ( 'Create e Update persistem o número residencial (numeroForn)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade    = await criarCidadeDeTeste ( transaction );
            const codCondDePag = await criarCondicaoDePagamentoDeTeste ( transaction );
            const dados =
            {
                codCidade, codCondDePag, fornecedor: 'Distribuidora Teste Ltda',
                tipoPessoa: 'JURIDICA' as const, enderecoForn: 'AV PAULISTA', numeroForn: 1578,
                cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                cpfCnpjForn: '11111111000101', inscEstSubTrib: '111111111111',
            };

            const novo = await repo.Create ( dados as never, 1, transaction );
            expect ( novo.numeroForn ).toBe ( 1578 );

            const editado = await repo.Update ( novo.codForn, { ...dados, numeroForn: 42, isActive: true } as never, 1, transaction );
            expect ( editado?.numeroForn ).toBe ( 42 );
        });
    });

    it ( 'Create persiste campos opcionais dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade     = await criarCidadeDeTeste ( transaction );
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade,
                    codCondDePag,
                    fornecedor:  'Fornecedor Completo SA',
                    nomeFantasia: 'FC Distribuidora',
                    tipoPessoa:  'JURIDICA',
                    cepForn:     '01310100',
                    cpfCnpjForn: '12345678000190',
                    foneForn:    '11912345678',
                    email:       'teste@kaneko.com.br',
                    inscEstSubTrib: '222222222222',
                },
                1,
                transaction
            );

            expect ( novo.nomeFantasia ).toBe ( 'FC Distribuidora' );
            expect ( novo.cpfCnpjForn ).toBe ( '12345678000190' );
        });
    });

    it ( 'Create persiste o RG de pessoa física', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade    = await criarCidadeDeTeste ( transaction );
            const codCondDePag = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, codCondDePag, fornecedor: 'Joao Autonomo', tipoPessoa: 'FISICA',
                    cepForn: '01310100', cpfCnpjForn: '12345678901', foneForn: '11912345678',
                    email: 'joao@kaneko.com.br', inscEstSubTrib: '123456', rg: '123456789',
                    dtNascimento: '1990-05-10', genero: 'MASCULINO',
                },
                1,
                transaction
            );

            expect ( novo.rg ).toBe ( '123456789' );
        });
    });

    it ( 'Update altera os dados do fornecedor dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade     = await criarCidadeDeTeste ( transaction );
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, codCondDePag, fornecedor: 'Fornecedor Original',
                    tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                    cpfCnpjForn: '33333333000103', inscEstSubTrib: '333333333333',
                },
                1,
                transaction
            );

            const atualizado = await repo.Update
            (
                novo.codForn,
                {
                    codCidade, codCondDePag, fornecedor: 'Fornecedor Atualizado',
                    tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                    cpfCnpjForn: '33333333000103', inscEstSubTrib: '333333333333',
                    isActive: true,
                },
                1,
                transaction
            );

            expect ( atualizado?.fornecedor ).toBe ( 'Fornecedor Atualizado' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade     = await criarCidadeDeTeste ( transaction );
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, codCondDePag, fornecedor: 'Para Excluir',
                    tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                    cpfCnpjForn: '44444444000104', inscEstSubTrib: '444444444444',
                },
                1,
                transaction
            );

            await repo.Delete ( novo.codForn, 1, transaction );

            const achado = await repo.FindById ( novo.codForn, transaction );
            expect ( achado?.isActive ).toBe ( false );

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Fornecedores" WHERE "codForn" = ${ novo.codForn }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há dependentes', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade     = await criarCidadeDeTeste ( transaction );
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, codCondDePag, fornecedor: 'Sem Dependentes',
                    tipoPessoa: 'JURIDICA', cepForn: '01310100', foneForn: '551133331111', email: 'teste@kaneko.com.br',
                    cpfCnpjForn: '55555555000105', inscEstSubTrib: '555555555555',
                },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codForn, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
