import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { AparelhosRepository } from '../../modules/aparelhos/aparelhos.repository';

const repo = new AparelhosRepository();

describe ( 'AparelhosRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere com os valores enviados e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const aparelho = await repo.Create
            (
                { aparelho: 'Notebook', serie: 'ABC123', modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' },
                1,
                transaction
            );

            expect ( aparelho.aparelho ).toBe ( 'Notebook' );
            expect ( aparelho.modelo ).toBe ( 'Inspiron 15' );

            const encontrado = await repo.FindById ( aparelho.codAparelho, transaction );

            expect ( encontrado ).toMatchObject ( { codAparelho: aparelho.codAparelho, modelo: 'Inspiron 15' } );
        });
    });

    it ( 'Create aceita aparelho e série opcionais como nulos', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const aparelho = await repo.Create
            ( { modelo: 'Sem marca', voltagem: '220V', garantia: 'Fora de garantia' }, 1, transaction );

            expect ( aparelho.aparelho ).toBeNull();
            expect ( aparelho.serie ).toBeNull();
        });
    });

    it ( 'FindById devolve null para código inexistente', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            expect ( await repo.FindById ( 999999, transaction ) ).toBeNull();
        });
    });
});
