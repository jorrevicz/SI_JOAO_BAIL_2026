import type postgres from 'postgres';
import sql from '../../lib/db';
import type CondicaoDePagamento from '../../db/types/public/CondicaoDePagamento';
import type { CreateCondicaoPagamentoInput, UpdateCondicaoPagamentoInput } from './condicoesPagamento.schema';

export class CondicoesPagamentoRepository
{
    async List
    (
        limit: number,
        afterId = 0,
        transaction?: postgres.TransactionSql
    ): Promise < CondicaoDePagamento[] >
    {
        const client = transaction ?? sql;

        return client < CondicaoDePagamento[] >`
            SELECT *
            FROM   "CondicaoDePagamento"
            WHERE  "isActive"      = true
            AND    "codCondDePag"  > ${ afterId }
            ORDER BY "codCondDePag"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < CondicaoDePagamento | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < CondicaoDePagamento[] >`
            SELECT *
            FROM   "CondicaoDePagamento"
            WHERE  "codCondDePag" = ${ id }
            AND    "isActive"     = true
        `;

        return row ?? null;
    }

    async Create
    (
        condPag: CreateCondicaoPagamentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < CondicaoDePagamento >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < CondicaoDePagamento[] >`
            INSERT INTO "CondicaoDePagamento"
            (
                "descricao",
                "juroCondPag",
                "multaCondPag",
                "descontoCondPag",
                "codUser"
            )
            VALUES
            (
                ${ condPag.descricao       ?? null },
                ${ condPag.juroCondPag     ?? null },
                ${ condPag.multaCondPag    ?? null },
                ${ condPag.descontoCondPag ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: number,
        condPag: UpdateCondicaoPagamentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < CondicaoDePagamento | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < CondicaoDePagamento[] >`
            UPDATE "CondicaoDePagamento"
            SET    "descricao" = ${ condPag.descricao ?? null },
                   "codUser"   = ${ codUser },
                   "dtEdicao"  = CURRENT_TIMESTAMP,
                   "isActive"  = ${ condPag.isActive }
            WHERE  "codCondDePag" = ${ id }
            AND    "isActive"     = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: number,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codCondDePag: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codCondDePag: number }[] >`
            UPDATE "CondicaoDePagamento"
            SET    "isActive"  = false,
                   "codUser"   = ${ codUser },
                   "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE  "codCondDePag" = ${ id }
            AND    "isActive"     = true
            RETURNING "codCondDePag"
        `;

        return row ?? null;
    }

    /**
     * Só considera referências externas (Clientes e Compras). "Parcelas" ficam de fora de
     * propósito: são filho embutido da condição, gerenciado de forma atômica junto dela
     * (RN003–RN006) e removido em cascata quando a condição é excluída.
     */
    async HasExternalReferences
    (
        id: number,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT 1 FROM "Clientes" WHERE "codCondDePag" = ${ id } AND "isActive" = true
            UNION ALL
            SELECT 1 FROM "Compras"  WHERE "codCondDePag" = ${ id } AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    }
}
