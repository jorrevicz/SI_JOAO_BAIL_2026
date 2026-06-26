import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from './db-helper';

describe('withTestTransaction', () => {
    afterAll ( async () => {
        await sql.end();
    });

    it ( 'rollback automático: inserção não persiste após o bloco', async () => {
        let codPais: number | undefined;

        await withTestTransaction ( async ( transaction ) => {
            const [ row ] = await transaction
            `
                INSERT INTO "Paises"
                (
                    "pais",
                    "sigla",
                    "ddi",
                    "moeda"
                )
                VALUES
                (
                    'Teste',
                    'TSt',
                    '+00',
                    'TST'
                )
                RETURNING "codPais"
            `;
            codPais = row.codPais;
        });

        const [ check ] = await sql
        `
            SELECT 1
            FROM "Paises" 
            WHERE "sigla" = 'TSt'
        `;

        expect ( codPais ).toBeDefined();
        expect ( check ).toBeUndefined();
    });
})
