import type postgres from 'postgres';
import sql from '../../lib/db';
import type ProcedimentosOdS from '../../db/types/public/ProcedimentosOdS';

export type ProcedimentoOdSInput = {
    codProcedimento: number;
    posicao:         string;
    checagem:        string;
    obsProcedimento?: string | null;
    dthFim?:         Date;
};

export class ProcedimentosOdSRepository
{
    async ListByOS
    (
        numOdS: string,
        transaction?: postgres.TransactionSql

    ): Promise < ProcedimentosOdS[] >
    {
        const client = transaction ?? sql;
        return client < ProcedimentosOdS[] >`
            SELECT *
            FROM "ProcedimentosOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            ORDER BY "codProcedimento"
        `;
    };

    async Create
    (
        numOdS: string,
        item:   ProcedimentoOdSInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < ProcedimentosOdS >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ProcedimentosOdS[] >`
            INSERT INTO "ProcedimentosOdS"
            (
                "numOdS",
                "codProcedimento",
                "posicao",
                "checagem",
                "obsProcedimento",
                "dthFim",
                "codUser"
            )
            VALUES
            (
                ${ numOdS },
                ${ item.codProcedimento },
                ${ item.posicao },
                ${ item.checagem },
                ${ item.obsProcedimento ?? null },
                ${ item.dthFim ?? sql`DEFAULT` },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        numOdS: string,
        codProcedimento: number,
        item:   ProcedimentoOdSInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < ProcedimentosOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ProcedimentosOdS[] >`
            UPDATE "ProcedimentosOdS"
            SET "posicao"         = ${ item.posicao },
                "checagem"        = ${ item.checagem },
                "obsProcedimento" = ${ item.obsProcedimento ?? null },
                "dthFim"          = ${ item.dthFim ?? new Date() },
                "codUser"         = ${ codUser },
                "dtEdicao"        = CURRENT_TIMESTAMP
            WHERE "numOdS"          = ${ numOdS }
            AND "codProcedimento"   = ${ codProcedimento }
            AND "isActive"          = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        numOdS: string,
        codProcedimento: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            UPDATE "ProcedimentosOdS"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS"        = ${ numOdS }
            AND "codProcedimento" = ${ codProcedimento }
            AND "isActive"        = true
        `;
    };
}
