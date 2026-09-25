import type postgres from 'postgres';
import sql from '../../lib/db';
import type Funcionarios from '../../db/types/public/Funcionarios';
import type { CreateFuncionarioInput, UpdateFuncionarioInput } from './funcionarios.schema';

export class FuncionariosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Funcionarios[] >
    {
        const client = transaction ?? sql;
        return client < Funcionarios[] >`
            SELECT *
            FROM "Funcionarios"
            WHERE "isActive" = true
            AND "codFuncionario" > ${ afterId }
            ORDER BY "codFuncionario"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Funcionarios | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Funcionarios[] >`
            SELECT *
            FROM "Funcionarios"
            WHERE "codFuncionario" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        funcionario: CreateFuncionarioInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Funcionarios >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Funcionarios[] >`
            INSERT INTO "Funcionarios"
            (
                "codCidade",
                "codCargo",
                "funcionario",
                "funcFone",
                "codUser"
            )
            VALUES
            (
                ${ funcionario.codCidade },
                ${ funcionario.codCargo },
                ${ funcionario.funcionario },
                ${ funcionario.funcFone },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        funcionario: UpdateFuncionarioInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Funcionarios | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Funcionarios[] >`
            UPDATE "Funcionarios"
            SET "codCidade"      = ${ funcionario.codCidade },
                "codCargo"       = ${ funcionario.codCargo },
                "funcionario"    = ${ funcionario.funcionario },
                "funcFone"       = ${ funcionario.funcFone },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP,
                "isActive"       = ${ funcionario.isActive }
            WHERE "codFuncionario" = ${ id }
            AND "isActive"         = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codFuncionario: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codFuncionario: number }[] >`
            UPDATE "Funcionarios"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "codFuncionario" = ${ id }
            AND "isActive"         = true
            RETURNING "codFuncionario"
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
            FROM "Servicos"
            WHERE "codFuncionario" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
