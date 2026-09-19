import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { ProcedimentosRepository } from '../../modules/procedimentos/procedimentos.repository';

const repo = new ProcedimentosRepository();

describe ( 'ProcedimentosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { procedimento: 'Há lacres?' },
                1,
                transaction
            );

            expect ( novo.codProcedimento ).toBeDefined();

            const achado = await repo.FindById ( novo.codProcedimento, transaction );
            expect ( achado?.procedimento ).toBe ( 'Há lacres?' );
        });
    });

    it ( 'Update altera o nome do procedimento dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { procedimento: 'Original' },
                1,
                transaction
            );

            const atualizado = await repo.Update
            (
                novo.codProcedimento,
                { procedimento: 'Atualizado', isActive: true },
                1,
                transaction
            );

            expect ( atualizado?.procedimento ).toBe ( 'Atualizado' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { procedimento: 'Para Excluir' },
                1,
                transaction
            );

            await repo.Delete ( novo.codProcedimento, 1, transaction );

            const achado = await repo.FindById ( novo.codProcedimento, transaction );
            expect ( achado ).toBeNull();
        });
    });

    it ( 'HasDependents retorna false quando não há checagens vinculadas', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create
            (
                { procedimento: 'Sem checagens' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( novo.codProcedimento, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
