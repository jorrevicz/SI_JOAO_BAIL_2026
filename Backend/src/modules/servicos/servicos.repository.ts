import type postgres from 'postgres';
import sql from '../../lib/db';
import type Servicos from '../../db/types/public/Servicos';
import type { CreateServicoInput, UpdateServicoInput } from './servicos.schema';

export class ServicosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Servicos[] >
    {
        const client = transaction ?? sql;
        return client < Servicos[] >`
            SELECT *
            FROM "Servicos"
            WHERE "codServico" > ${ afterId }
            ORDER BY "codServico"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Servicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Servicos[] >`
            SELECT *
            FROM "Servicos"
            WHERE "codServico" = ${ id }
        `;

        return row ?? null;
    };

    async Create
    (
        servico: CreateServicoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Servicos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Servicos[] >`
            INSERT INTO "Servicos"
            (
                "servico",
                "valor",
                "codFuncionario",
                "codUser"
            )
            VALUES
            (
                ${ servico.servico },
                ${ servico.valor },
                ${ servico.codFuncionario },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        servico: UpdateServicoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Servicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Servicos[] >`
            UPDATE "Servicos"
            SET "servico"        = ${ servico.servico },
                "valor"          = ${ servico.valor },
                "codFuncionario" = ${ servico.codFuncionario },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP,
                "isActive"       = ${ servico.isActive }
            WHERE "codServico" = ${ id }
            AND "isActive"     = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codServico: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codServico: number }[] >`
            UPDATE "Servicos"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "codServico" = ${ id }
            AND "isActive"     = true
            RETURNING "codServico"
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
            FROM "ServicosOdS"
            WHERE "codServico" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
