import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { criarCondicaoDePagamentoDeTeste, criarFormaDePagamentoDeTeste } from '../helpers/fixtures';
import { ParcelasRepository } from '../../modules/parcelas/parcelas.repository';

const repo = new ParcelasRepository();

describe ( 'ParcelasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const nova = await repo.Create
            (
                { codCondDePag, codFormaDePag, percentual: 100, numDias: 30 },
                1,
                transaction
            );

            expect ( nova.codParcela ).toBeDefined();

            const achada = await repo.FindById ( nova.codParcela, transaction );
            expect ( parseFloat ( achada!.percentual ) ).toBe ( 100 );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            const nova = await repo.Create
            (
                { codCondDePag, codFormaDePag, percentual: 100, numDias: 30 },
                1,
                transaction
            );

            await repo.Delete ( nova.codParcela, 1, transaction );

            const achada = await repo.FindById ( nova.codParcela, transaction );
            expect ( achada ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Parcelas" WHERE "codParcela" = ${ nova.codParcela }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });
});
