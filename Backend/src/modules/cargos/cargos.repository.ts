import type postgres from 'postgres';
import sql from '../../lib/db';
import type Cargos from '../../db/types/public/Cargos';
import type { CreateCargoInput, UpdateCargoInput } from './cargos.schema';

export class CargosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Cargos[] >
    {
        const client = transaction ?? sql;
        return client < Cargos[] >`
            SELECT *
            FROM "Cargos"
            WHERE "isActive" = true
            AND "codCargo" > ${ afterId }
            ORDER BY "codCargo"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Cargos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cargos[] >`
            SELECT *
            FROM "Cargos"
            WHERE "codCargo" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        cargo:   CreateCargoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Cargos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cargos[] >`
            INSERT INTO "Cargos"
            (
                "cargo",
                "codUser"
            )
            VALUES
            (
                ${ cargo.cargo },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        cargo:   UpdateCargoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Cargos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Cargos[] >`
            UPDATE "Cargos"
            SET "cargo"    = ${ cargo.cargo },
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP,
                "isActive" = ${ cargo.isActive }
            WHERE "codCargo" = ${ id }
            AND "isActive"   = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codCargo: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codCargo: number }[] >`
            UPDATE "Cargos"
            SET "isActive" = false,
                "codUser"  = ${ codUser },
                "dtEdicao" = CURRENT_TIMESTAMP
            WHERE "codCargo" = ${ id }
            AND "isActive"   = true
            RETURNING "codCargo"
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
            FROM "Funcionarios"
            WHERE "codCargo" = ${ id }
            AND "isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
