import type postgres from 'postgres';
import sql from '../../lib/db';
import type FormaDePagamento from '../../db/types/public/FormaDePagamento';
import type { CreateFormaPagamentoInput, UpdateFormaPagamentoInput } from './formasPagamento.schema';

export class FormasPagamentoRepository
{
    async List
    (
        limit: number,
        afterId = 0,
        transaction?: postgres.TransactionSql
    ): Promise < FormaDePagamento[] >
    {
        const client = transaction ?? sql;

        return client < FormaDePagamento[] >`
            SELECT *
            FROM   "FormaDePagamento"
            WHERE  "codFormaDePag"  > ${ afterId }
            ORDER BY "codFormaDePag"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < FormaDePagamento | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < FormaDePagamento[] >`
            SELECT *
            FROM   "FormaDePagamento"
            WHERE  "codFormaDePag" = ${ id }
        `;

        return row ?? null;
    }

    async Create
    (
        formPag: CreateFormaPagamentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < FormaDePagamento >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < FormaDePagamento[] >`
            INSERT INTO "FormaDePagamento"
            (
                "formaDePag",
                "prazoCompensacao",
                "codUser"
            )
            VALUES
            (
                ${ formPag.formaDePag },
                ${ formPag.prazoCompensacao ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: number,
        formPag: UpdateFormaPagamentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < FormaDePagamento | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < FormaDePagamento[] >`
            UPDATE "FormaDePagamento"
            SET    "formaDePag" = ${ formPag.formaDePag },
                   "codUser"    = ${ codUser },
                   "dtEdicao"   = CURRENT_TIMESTAMP,
                   "isActive"   = ${ formPag.isActive }
            WHERE  "codFormaDePag" = ${ id }
            AND    "isActive"      = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codFormaDePag: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codFormaDePag: number }[] >`
            UPDATE "FormaDePagamento"
            SET    "isActive"  = false,
                   "codUser"   = ${ codUser },
                   "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE  "codFormaDePag" = ${ id }
            AND    "isActive"      = true
            RETURNING "codFormaDePag"
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
            SELECT 1 FROM "Parcelas"        WHERE "codFormaDePag" = ${ id } AND "isActive" = true
            UNION ALL
            SELECT 1 FROM "ContasAReceber"  WHERE "codFormaDePag" = ${ id } AND "isActive" = true
            UNION ALL
            SELECT 1 FROM "ContasAPagar"    WHERE "codFormaDePag" = ${ id } AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    }
}
