import type postgres from 'postgres';
import sql from '../../lib/db';
import type Paises from '../../db/types/public/Paises';
import type { CreatePaisInput, UpdatePaisInput } from './paises.schema';

export class PaisesRepository
{
    async List
    (
        limit: number, 
        afterId = 0, 
        transaction?: postgres.TransactionSql

    ): Promise < Paises[] > 
    {
        const client = transaction ?? sql;
        return client < Paises[] >`
            SELECT *
            FROM "Paises"
            WHERE "isActive" = true
            AND "codPais" > ${ afterId }
            ORDER BY "codPais"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Paises | null > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Paises[] >`
            SELECT *
            FROM "Paises"
            WHERE "codPais" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        pais: CreatePaisInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Paises > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Paises[] >`
            INSERT INTO "Paises"
            (
                "pais",
                "sigla",
                "ddi",
                "moeda",
                "codUser"
            )
            VALUES
            (
                ${ pais.pais },
                ${ pais.sigla },
                ${ pais.ddi ?? null } ,
                ${ pais.moeda ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id: number,
        pais: UpdatePaisInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Paises | null > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Paises[] >`
            UPDATE "Paises"
            SET "pais"      = ${ pais.pais },
                "sigla"     = ${ pais.sigla },
                "ddi"       = ${ pais.ddi ?? null },
                "moeda"     = ${ pais.moeda ?? null },
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP,
                "isActive"  = ${ pais.isActive }
            WHERE "codPais" = ${ id }
            AND "isActive"  = true
            RETURNING *
        `

        return row ?? null;
    };

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codPais: number } | null > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codPais: number }[] >`
            UPDATE "Paises"
            SET "isActive" = false, "codUser" = ${ codUser }, "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "codPais" = ${ id }
            AND "isActive" = true
            RETURNING "codPais"
        `;

        return row ?? null;
    };

    async HasDependents
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT  1
            FROM "Estados"
            WHERE "codPais" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
