import type postgres from 'postgres';
import sql from '../../lib/db';
import type OrcamentoPecasOdS from '../../db/types/public/OrcamentoPecasOdS';
import type { OrcamentoPecaOdSItem } from '../ordens-servico/ordensServico.schema';

export class OrcamentoPecasOdSRepository
{
    async ListByOS
    (
        numOdS: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrcamentoPecasOdS[] >
    {
        const client = transaction ?? sql;
        return client < OrcamentoPecasOdS[] >`
            SELECT *
            FROM "OrcamentoPecasOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            ORDER BY "codPeca"
        `;
    };

    async FindOne
    (
        numOdS: number,
        codPeca: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrcamentoPecasOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrcamentoPecasOdS[] >`
            SELECT *
            FROM "OrcamentoPecasOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "codPeca"  = ${ codPeca }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        numOdS: number,
        item:   OrcamentoPecaOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrcamentoPecasOdS >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrcamentoPecasOdS[] >`
            INSERT INTO "OrcamentoPecasOdS"
            (
                "numOdS",
                "codPeca",
                "vlrPv",
                "codUser"
            )
            VALUES
            (
                ${ numOdS },
                ${ item.codPeca },
                ${ item.vlrPv },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        numOdS: number,
        codPeca: number,
        item:   OrcamentoPecaOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrcamentoPecasOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrcamentoPecasOdS[] >`
            UPDATE "OrcamentoPecasOdS"
            SET "vlrPv"    = ${ item.vlrPv },
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS"  = ${ numOdS }
            AND "codPeca"   = ${ codPeca }
            AND "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Aprovar
    (
        numOdS: number,
        codPeca: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrcamentoPecasOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrcamentoPecasOdS[] >`
            UPDATE "OrcamentoPecasOdS"
            SET "aprovado" = true,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS"  = ${ numOdS }
            AND "codPeca"   = ${ codPeca }
            AND "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        numOdS: number,
        codPeca: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            UPDATE "OrcamentoPecasOdS"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS" = ${ numOdS }
            AND "codPeca"  = ${ codPeca }
            AND "isActive" = true
        `;
    };
}
