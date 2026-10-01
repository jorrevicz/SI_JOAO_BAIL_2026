import type postgres from 'postgres';
import sql from '../../lib/db';
import type SubstituirPecasOdS from '../../db/types/public/SubstituirPecasOdS';
import type { SubstituirPecaOdSItem } from '../ordens-servico/ordensServico.schema';

export class SubstituirPecasOdSRepository
{
    async ListByOS
    (
        numOdS: number,
        transaction?: postgres.TransactionSql

    ): Promise < SubstituirPecasOdS[] >
    {
        const client = transaction ?? sql;
        return client < SubstituirPecasOdS[] >`
            SELECT *
            FROM "SubstituirPecasOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            ORDER BY "codPeca"
        `;
    };

    async Create
    (
        numOdS: number,
        item:   SubstituirPecaOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < SubstituirPecasOdS >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < SubstituirPecasOdS[] >`
            INSERT INTO "SubstituirPecasOdS"
            (
                "numOdS",
                "codPeca",
                "qtdPeca",
                "vlrUnitarioPeca",
                "codUser"
            )
            VALUES
            (
                ${ numOdS },
                ${ item.codPeca },
                ${ item.qtdPeca },
                ${ item.vlrUnitarioPeca },
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
        item:   SubstituirPecaOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < SubstituirPecasOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < SubstituirPecasOdS[] >`
            UPDATE "SubstituirPecasOdS"
            SET "qtdPeca"         = ${ item.qtdPeca },
                "vlrUnitarioPeca" = ${ item.vlrUnitarioPeca },
                "codUser"         = ${ codUser },
                "dtEdicao"        = CURRENT_TIMESTAMP
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
            UPDATE "SubstituirPecasOdS"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS" = ${ numOdS }
            AND "codPeca"  = ${ codPeca }
            AND "isActive" = true
        `;
    };
}
