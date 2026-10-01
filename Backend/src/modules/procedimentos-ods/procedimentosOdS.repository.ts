import type postgres from 'postgres';
import sql from '../../lib/db';
import type ProcedimentosOdS from '../../db/types/public/ProcedimentosOdS';
import type
{
    ProcedimentoEstruturaOdSItem,
    ProcedimentoOdSItem,
} from '../ordens-servico/ordensServico.schema';

export class ProcedimentosOdSRepository
{
    async ListByOS
    (
        numOdS: number,
        transaction?: postgres.TransactionSql

    ): Promise < ProcedimentosOdS[] >
    {
        const client = transaction ?? sql;
        return client < ProcedimentosOdS[] >`
            SELECT *
            FROM "ProcedimentosOdS"
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            ORDER BY "ordem"
        `;
    };

    /**
     * Cria a linha só com a estrutura (procedimento + ordem) — os campos de checagem
     * nascem nulos, preenchidos depois via `UpdateChecagem` (RN009).
     */
    async CreateEstrutura
    (
        numOdS: number,
        item:   ProcedimentoEstruturaOdSItem,
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
                "ordem",
                "codUser"
            )
            VALUES
            (
                ${ numOdS },
                ${ item.codProcedimento },
                ${ item.ordem },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    /**
     * Atualiza só a posição da linha na ordem da checklist — não mexe em dados de
     * checagem (RN009).
     */
    async UpdateOrdem
    (
        numOdS: number,
        codProcedimento: number,
        ordem: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < ProcedimentosOdS | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ProcedimentosOdS[] >`
            UPDATE "ProcedimentosOdS"
            SET "ordem"    = ${ ordem },
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "numOdS"        = ${ numOdS }
            AND "codProcedimento" = ${ codProcedimento }
            AND "isActive"        = true
            RETURNING *
        `;

        return row ?? null;
    };

    /**
     * Preenche os campos de checagem de uma linha já existente na estrutura — não
     * mexe em `ordem` (RN003/RN010).
     */
    async UpdateChecagem
    (
        numOdS: number,
        codProcedimento: number,
        item:   ProcedimentoOdSItem,
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
                "dthFim"          = ${ item.dthFim },
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
        numOdS: number,
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
