import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { PecasRepository } from '../../modules/pecas/pecas.repository';

const repo = new PecasRepository();

describe ( 'PecasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create ( { peca: 'Placa-mãe' }, 1, transaction );

            expect ( nova.codPeca ).toBeDefined();

            const achada = await repo.FindById ( nova.codPeca, transaction );
            expect ( achada?.peca ).toBe ( 'Placa-mãe' );
        });
    });

    it ( 'Update altera o nome da peça dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create ( { peca: 'Original' }, 1, transaction );

            const atualizada = await repo.Update
            ( nova.codPeca, { peca: 'Atualizada', isActive: true }, 1, transaction );

            expect ( atualizada?.peca ).toBe ( 'Atualizada' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create ( { peca: 'Para Excluir' }, 1, transaction );

            await repo.Delete ( nova.codPeca, 1, transaction );

            const achada = await repo.FindById ( nova.codPeca, transaction );
            expect ( achada ).toBeNull();
        });
    });

    it ( 'HasDependents retorna false quando não há orçamentos/substituições vinculados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create ( { peca: 'Sem Vínculo' }, 1, transaction );

            const temDependentes = await repo.HasDependents ( nova.codPeca, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
