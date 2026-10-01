import type postgres from 'postgres';
import sql from '../../lib/db';
import type ServicosOdS from '../../db/types/public/ServicosOdS';
import type { ServicoOdSItem } from '../ordens-servico/ordensServico.schema';

export class ServicosOdSRepository
{
    async ListByOS
    (
        numOdS: number,
        transaction?: postgres.TransactionSql

    ): Promise < ServicosOdS[] >
    {
        const client = transaction ?? sql;
        return client < ServicosOdS[] >`
            SELECT *
            FROM "ServicosOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            ORDER BY "codServico"
        `;
    };

    async Create
    (
        numOdS: number,
        item:   ServicoOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < ServicosOdS >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ServicosOdS[] >`
            INSERT INTO "ServicosOdS"
            (
                "numOdS",
                "codServico",
                "qtdServico",
                "codUser"
            )
            VALUES
            (
                ${ numOdS },
                ${ item.codServico },
                ${ item.qtdServico },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        numOdS: number,
        codServico: number,
        item:   ServicoOdSItem,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < ServicosOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ServicosOdS[] >`
            UPDATE "ServicosOdS"
            SET "qtdServico" = ${ item.qtdServico },
                "codUser"    = ${ codUser },
                "dtEdicao"   = CURRENT_TIMESTAMP
            WHERE "numOdS"     = ${ numOdS }
            AND "codServico"   = ${ codServico }
            AND "isActive"     = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        numOdS: number,
        codServico: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            UPDATE "ServicosOdS"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS"     = ${ numOdS }
            AND "codServico"   = ${ codServico }
            AND "isActive"     = true
        `;
    };
}
