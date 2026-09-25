import type postgres from 'postgres';
import sql from '../../lib/db';
import type Pecas from '../../db/types/public/Pecas';
import type { CreatePecaInput, UpdatePecaInput } from './pecas.schema';

export class PecasRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Pecas[] >
    {
        const client = transaction ?? sql;
        return client < Pecas[] >`
            SELECT *
            FROM "Pecas"
            WHERE "isActive" = true
            AND "codPeca" > ${ afterId }
            ORDER BY "codPeca"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Pecas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Pecas[] >`
            SELECT *
            FROM "Pecas"
            WHERE "codPeca" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        peca:    CreatePecaInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Pecas >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Pecas[] >`
            INSERT INTO "Pecas"
            (
                "peca",
                "codUser"
            )
            VALUES
            (
                ${ peca.peca },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        peca:    UpdatePecaInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Pecas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Pecas[] >`
            UPDATE "Pecas"
            SET "peca"     = ${ peca.peca },
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP,
                "isActive" = ${ peca.isActive }
            WHERE "codPeca" = ${ id }
            AND "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codPeca: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codPeca: number }[] >`
            UPDATE "Pecas"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "codPeca" = ${ id }
            AND "isActive"  = true
            RETURNING "codPeca"
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
            SELECT 1
            FROM "OrcamentoPecasOdS"
            WHERE "codPeca" = ${ id }
            AND "isActive" = true
            UNION ALL
            SELECT 1
            FROM "SubstituirPecasOdS"
            WHERE "codPeca" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
