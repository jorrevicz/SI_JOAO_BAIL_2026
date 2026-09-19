import type postgres from 'postgres';
import sql from '../../lib/db';
import type Procedimentos from '../../db/types/public/Procedimentos';
import type { CreateProcedimentoInput, UpdateProcedimentoInput } from './procedimentos.schema';

export class ProcedimentosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Procedimentos[] >
    {
        const client = transaction ?? sql;
        return client < Procedimentos[] >`
            SELECT *
            FROM "Procedimentos"
            WHERE "isActive" = true
            AND "codProcedimento" > ${ afterId }
            ORDER BY "codProcedimento"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Procedimentos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Procedimentos[] >`
            SELECT *
            FROM "Procedimentos"
            WHERE "codProcedimento" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        procedimento: CreateProcedimentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Procedimentos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Procedimentos[] >`
            INSERT INTO "Procedimentos"
            (
                "procedimento",
                "codUser"
            )
            VALUES
            (
                ${ procedimento.procedimento },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id: number,
        procedimento: UpdateProcedimentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Procedimentos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Procedimentos[] >`
            UPDATE "Procedimentos"
            SET "procedimento"     = ${ procedimento.procedimento },
                "codUser"          = ${ codUser },
                "dtEdicao"         = CURRENT_TIMESTAMP,
                "isActive"         = ${ procedimento.isActive }
            WHERE "codProcedimento" = ${ id }
            AND "isActive"          = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codProcedimento: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codProcedimento: number }[] >`
            UPDATE "Procedimentos"
            SET "isActive"  = false,
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "codProcedimento" = ${ id }
            AND "isActive"          = true
            RETURNING "codProcedimento"
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
            FROM "ProcedimentosOdS"
            WHERE "codProcedimento" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
