import type postgres from 'postgres';
import sql from '../../lib/db';
import type Clientes from '../../db/types/public/Clientes';
import type { CreateClienteInput, UpdateClienteInput } from './clientes.schema';

export class ClientesRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Clientes[] >
    {
        const client = transaction ?? sql;
        return client < Clientes[] >`
            SELECT *
            FROM "Clientes"
            WHERE "isActive" = true
            AND "codCliente" > ${ afterId }
            ORDER BY "codCliente"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Clientes | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Clientes[] >`
            SELECT *
            FROM "Clientes"
            WHERE "codCliente" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        cliente:    CreateClienteInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Clientes >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Clientes[] >`
            INSERT INTO "Clientes"
            (
                "codCidade",
                "cliente",
                "tipoPessoa",
                "codCondDePag",
                "enderecoCl",
                "bairroCl",
                "cepCl",
                "foneCl",
                "codUser"
            )
            VALUES
            (
                ${ cliente.codCidade },
                ${ cliente.cliente },
                ${ cliente.tipoPessoa   ?? null },
                ${ cliente.codCondDePag ?? null },
                ${ cliente.enderecoCl   ?? null },
                ${ cliente.bairroCl     ?? null },
                ${ cliente.cepCl        ?? null },
                ${ cliente.foneCl       ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        cliente:    UpdateClienteInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Clientes | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Clientes[] >`
            UPDATE "Clientes"
            SET "codCidade"    = ${ cliente.codCidade },
                "cliente"      = ${ cliente.cliente },
                "tipoPessoa"   = ${ cliente.tipoPessoa   ?? null },
                "codCondDePag" = ${ cliente.codCondDePag ?? null },
                "enderecoCl"   = ${ cliente.enderecoCl   ?? null },
                "bairroCl"     = ${ cliente.bairroCl     ?? null },
                "cepCl"        = ${ cliente.cepCl        ?? null },
                "foneCl"       = ${ cliente.foneCl       ?? null },
                "codUser"      = ${ codUser },
                "dtEdicao"     = CURRENT_TIMESTAMP,
                "isActive"     = ${ cliente.isActive }
            WHERE "codCliente" = ${ id }
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

    ): Promise < { codCliente: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codCliente: number }[] >`
            UPDATE "Clientes"
            SET "isActive"   = false,
                "codUser"    = ${ codUser },
                "dtEdicao"   = CURRENT_TIMESTAMP
            WHERE "codCliente" = ${ id }
            AND "isActive"   = true
            RETURNING "codCliente"
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
            FROM "ContasAReceber"
            WHERE "codCliente" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
