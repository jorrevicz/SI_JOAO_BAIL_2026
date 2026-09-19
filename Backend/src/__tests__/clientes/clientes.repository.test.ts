import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { ClientesRepository } from '../../modules/clientes/clientes.repository';

const repo = new ClientesRepository();

describe ( 'ClientesRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, cliente: 'Maria Oliveira',
                    tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
                },
                1,
                transaction
            );

            expect ( novo.codCliente ).toBeDefined();
            expect ( novo.cliente ).toBe ( 'Maria Oliveira' );

            const achado = await repo.FindById ( novo.codCliente, transaction );
            expect ( achado?.cliente ).toBe ( 'Maria Oliveira' );
        });
    });

    it ( 'Update altera os dados do cliente dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, cliente: 'Cliente Original',
                    tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
                },
                1,
                transaction
            );

            const atualizado = await repo.Update
            (
                novo.codCliente,
                {
                    codCidade, cliente: 'Cliente Atualizado',
                    tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
                    isActive: true,
                },
                1,
                transaction
            );

            expect ( atualizado?.cliente ).toBe ( 'Cliente Atualizado' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, cliente: 'Para Excluir',
                    tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
                },
                1,
                transaction
            );

            await repo.Delete ( novo.codCliente, 1, transaction );

            const achado = await repo.FindById ( novo.codCliente, transaction );
            expect ( achado ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Clientes" WHERE "codCliente" = ${ novo.codCliente }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há contas a receber', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const novo = await repo.Create
            (
                {
                    codCidade, cliente: 'Sem Dependentes',
                    tipoPessoa: 'FISICA', cepCl: '20511120', foneCl: '5521988887777',
                },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codCliente, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
