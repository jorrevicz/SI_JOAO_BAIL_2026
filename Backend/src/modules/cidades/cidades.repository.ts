import type postgres from 'postgres';
import sql from '../../lib/db';
import type Cidades from '../../db/types/public/Cidades';
import type { CreateCidadeInput, UpdateCidadeInput } from './cidades.schema';

export class CidadesRepository
{
    async List
    (
        limit: number,
        afterId = 0,
        codEstado?: number,
        transaction?: postgres.TransactionSql
    ): Promise < Cidades[] >
    {
        const client = transaction ?? sql;

        return client < Cidades[] >`
            SELECT *
            FROM   "Cidades"
            WHERE  "isActive"  = true
            AND    "codCidade" > ${ afterId }
            ${ codEstado ? client`AND "codEstado" = ${ codEstado }` : client`` }
            ORDER BY "codCidade"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < Cidades | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cidades[] >`
            SELECT *
            FROM   "Cidades"
            WHERE  "codCidade" = ${ id }
            AND    "isActive"  = true
        `;

        return row ?? null;
    }

    async Create
    (
        d: CreateCidadeInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Cidades >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cidades[] >`
            INSERT INTO "Cidades"
            (
                "codEstado",
                "cidade",
                "ddd",
                "codUser"
            )
            VALUES
            (
                ${ d.codEstado },
                ${ d.cidade },
                ${ d.ddd ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: number,
        d: UpdateCidadeInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Cidades | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cidades[] >`
            UPDATE "Cidades"
            SET    "codEstado" = ${ d.codEstado },
                   "cidade"   = ${ d.cidade },
                   "ddd"      = ${ d.ddd ?? null },
                   "codUser"  = ${ codUser },
                   "dtEdicao" = CURRENT_TIMESTAMP
            WHERE  "codCidade" = ${ id }
            AND    "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codCidade: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codCidade: number }[] >`
            DELETE FROM "Cidades"
            WHERE "codCidade" = ${ id }
            AND "isActive" = true
            RETURNING "codCidade"
        `;
        // UPDATE "Cidades"
            // SET    "isActive"  = false,
            //        "codUser"   = ${ codUser },
            //        "dtEdicao"  = CURRENT_TIMESTAMP
            // WHERE  "codCidade" = ${ id }
            // AND    "isActive"  = true
            // RETURNING "codCidade"

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
            SELECT 1 FROM "Clientes"        WHERE "codCidade" = ${ id } AND "isActive" = true
            UNION ALL
            SELECT 1 FROM "Fornecedores"    WHERE "codCidade" = ${ id } AND "isActive" = true
            UNION ALL
            SELECT 1 FROM "Transportadoras" WHERE "codCidade" = ${ id } AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    }
}
