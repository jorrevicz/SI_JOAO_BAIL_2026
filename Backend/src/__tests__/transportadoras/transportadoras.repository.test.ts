import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCidadeDeTeste } from '../helpers/fixtures';
import { TransportadorasRepository } from '../../modules/transportadoras/transportadoras.repository';

const repo = new TransportadorasRepository();

describe ( 'TransportadorasRepository (rollback)', () =>
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

            const nova = await repo.Create
            (
                { codCidade, transportadora: 'Expressa Logística Ltda' },
                1,
                transaction
            );

            expect ( nova.codTransp ).toBeDefined();
            expect ( nova.transportadora ).toBe ( 'Expressa Logística Ltda' );

            const achada = await repo.FindById ( nova.codTransp, transaction );
            expect ( achada?.transportadora ).toBe ( 'Expressa Logística Ltda' );
        });
    });

    it ( 'Update altera os dados da transportadora dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                { codCidade, transportadora: 'Transportadora Original' },
                1,
                transaction
            );

            const atualizada = await repo.Update
            (
                nova.codTransp,
                {
                    codCidade,
                    transportadora: 'Transportadora Atualizada',
                    tipoPessoa:     'JURIDICA',
                    isActive:       true,
                },
                1,
                transaction
            );

            expect ( atualizada?.transportadora ).toBe ( 'Transportadora Atualizada' );
            expect ( atualizada?.tipoPessoa ).toBe ( 'JURIDICA' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                { codCidade, transportadora: 'Para Excluir' },
                1,
                transaction
            );

            await repo.Delete ( nova.codTransp, 1, transaction );

            const achada = await repo.FindById ( nova.codTransp, transaction );
            expect ( achada ).toBeNull();
        });
    });

    it ( 'HasDependents retorna false quando não há compras ou NF-e vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCidade = await criarCidadeDeTeste ( transaction );

            const nova = await repo.Create
            (
                { codCidade, transportadora: 'Sem Dependentes' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( nova.codTransp, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
