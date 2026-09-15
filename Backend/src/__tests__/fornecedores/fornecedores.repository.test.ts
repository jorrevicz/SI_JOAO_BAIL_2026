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
                { codCidade, codCondDePag, fornecedor: 'Distribuidora Teste Ltda' },
                1,
                transaction
            );

            expect ( novo.codForn ).toBeDefined();
            expect ( novo.fornecedor ).toBe ( 'Distribuidora Teste Ltda' );

            const achado = await repo.FindById ( novo.codForn, transaction );
            expect ( achado?.fornecedor ).toBe ( 'Distribuidora Teste Ltda' );
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
                    cpfCnpjForn: '12345678000190',
                    foneForn:    '11912345678',
                },
                1,
                transaction
            );

            expect ( novo.nomeFantasia ).toBe ( 'FC Distribuidora' );
            expect ( novo.cpfCnpjForn ).toBe ( '12345678000190' );
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
                { codCidade, codCondDePag, fornecedor: 'Fornecedor Original' },
                1,
                transaction
            );

            const atualizado = await repo.Update
            (
                novo.codForn,
                { codCidade, codCondDePag, fornecedor: 'Fornecedor Atualizado', isActive: true },
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
                { codCidade, codCondDePag, fornecedor: 'Para Excluir' },
                1,
                transaction
            );

            await repo.Delete ( novo.codForn, 1, transaction );

            const achado = await repo.FindById ( novo.codForn, transaction );
            expect ( achado ).toBeNull();
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
                { codCidade, codCondDePag, fornecedor: 'Sem Dependentes' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codForn, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
