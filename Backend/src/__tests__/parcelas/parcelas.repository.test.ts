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
                { codCondDePag, numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 },
                1,
                transaction
            );

            expect ( Number ( nova.numParcela ) ).toBe ( 1 );

            const achada = await repo.FindById ( codCondDePag, 1, transaction );
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
                { codCondDePag, numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 },
                1,
                transaction
            );

            await repo.Delete ( codCondDePag, 1, 1, transaction );

            const achada = await repo.FindById ( codCondDePag, 1, transaction );
            expect ( achada ).toBeNull();

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Parcelas"
                WHERE "codCondDePag" = ${ codCondDePag } AND "numParcela" = ${ nova.numParcela }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'Create lança 409 quando o número já existe ativo na condição', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );
            const dados = { codCondDePag, numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 };

            await repo.Create ( dados, 1, transaction );

            await expect ( repo.Create ( dados, 1, transaction ) ).rejects.toMatchObject ( { status: 409 } );
        });
    });

    it ( 'Create reativa o número de uma parcela removida (soft delete)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const codCondDePag  = await criarCondicaoDePagamentoDeTeste ( transaction );
            const codFormaDePag = await criarFormaDePagamentoDeTeste ( transaction );

            await repo.Create ( { codCondDePag, numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 }, 1, transaction );
            await repo.Delete ( codCondDePag, 1, 1, transaction );

            const reativada = await repo.Create
            (
                { codCondDePag, numParcela: 1, codFormaDePag, percentual: 50, numDias: 15 },
                1,
                transaction
            );

            expect ( reativada.isActive ).toBe ( true );
            expect ( reativada.numDias ).toBe ( 15 );
        });
    });

    it ( 'permite o mesmo numParcela em condições diferentes (chave composta)', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const primeiraCondicao = await criarCondicaoDePagamentoDeTeste ( transaction );
            const segundaCondicao  = await criarCondicaoDePagamentoDeTeste ( transaction );
            const codFormaDePag    = await criarFormaDePagamentoDeTeste ( transaction );

            await repo.Create ( { codCondDePag: primeiraCondicao, numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 }, 1, transaction );
            await repo.Create ( { codCondDePag: segundaCondicao,  numParcela: 1, codFormaDePag, percentual: 100, numDias: 30 }, 1, transaction );

            expect ( await repo.FindById ( primeiraCondicao, 1, transaction ) ).not.toBeNull();
            expect ( await repo.FindById ( segundaCondicao,  1, transaction ) ).not.toBeNull();
        });
    });
});
