import type postgres from 'postgres';
import sql from '../../lib/db';
import type Parcelas from '../../db/types/public/Parcelas';
import type { CreateParcelaInput, UpdateParcelaInput } from './parcelas.schema';

export class ParcelasRepository
{
    async List
    (
        limit: number,
        afterId = 0,
        codCondDePag?: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas[] >
    {
        const client = transaction ?? sql;

        return client < Parcelas[] >`
            SELECT *
            FROM   "Parcelas"
            WHERE  "isActive"   = true
            AND    "codParcela" > ${ afterId }
            ${ codCondDePag ? client`AND "codCondDePag" = ${ codCondDePag }` : client`` }
            ORDER BY "numDias", "codParcela"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            SELECT *
            FROM   "Parcelas"
            WHERE  "codParcela" = ${ id }
            AND    "isActive"   = true
        `;

        return row ?? null;
    }

    async Create
    (
        parcela: CreateParcelaInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            INSERT INTO "Parcelas"
            (
                "codCondDePag",
                "codFormaDePag",
                "percentual",
                "numDias",
                "codUser"
            )
            VALUES
            (
                ${ parcela.codCondDePag  },
                ${ parcela.codFormaDePag },
                ${ parcela.percentual    },
                ${ parcela.numDias       },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: number,
        parcela: UpdateParcelaInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            UPDATE "Parcelas"
            SET    "codCondDePag"  = ${ parcela.codCondDePag  },
                   "codFormaDePag" = ${ parcela.codFormaDePag },
                   "percentual"    = ${ parcela.percentual    },
                   "numDias"       = ${ parcela.numDias       },
                   "codUser"       = ${ codUser },
                   "dtEdicao"      = CURRENT_TIMESTAMP,
                   "isActive"      = ${ parcela.isActive }
            WHERE  "codParcela" = ${ id }
            AND    "isActive"   = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codParcela: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codParcela: number }[] >`
            UPDATE "Parcelas"
            SET    "isActive"  = false,
                   "codUser"   = ${ codUser },
                   "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE  "codParcela" = ${ id }
            AND    "isActive"   = true
            RETURNING "codParcela"
        `;

        return row ?? null;
    }

    async HasDependents
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT 1 FROM "ContasAPagar" WHERE "codParcela" = ${ id } AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    }
}
