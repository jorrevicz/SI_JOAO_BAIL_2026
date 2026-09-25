import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { CargosRepository } from '../../modules/cargos/cargos.repository';

const repo = new CargosRepository();

describe ( 'CargosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create ( { cargo: 'Técnico' }, 1, transaction );

            expect ( novo.codCargo ).toBeDefined();

            const achado = await repo.FindById ( novo.codCargo, transaction );
            expect ( achado?.cargo ).toBe ( 'Técnico' );
        });
    });

    it ( 'Update altera o nome do cargo dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create ( { cargo: 'Original' }, 1, transaction );

            const atualizado = await repo.Update
            ( novo.codCargo, { cargo: 'Atualizado', isActive: true }, 1, transaction );

            expect ( atualizado?.cargo ).toBe ( 'Atualizado' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create ( { cargo: 'Para Excluir' }, 1, transaction );

            await repo.Delete ( novo.codCargo, 1, transaction );

            const achado = await repo.FindById ( novo.codCargo, transaction );
            expect ( achado ).toBeNull();
        });
    });

    it ( 'HasDependents retorna false quando não há funcionários vinculados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const novo = await repo.Create ( { cargo: 'Sem Vínculo' }, 1, transaction );

            const temDependentes = await repo.HasDependents ( novo.codCargo, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
