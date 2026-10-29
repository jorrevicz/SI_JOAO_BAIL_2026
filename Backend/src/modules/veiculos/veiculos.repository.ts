import type postgres from 'postgres';
import sql from '../../lib/db';
import type Veiculos from '../../db/types/public/Veiculos';
import type { CreateVeiculoInput, UpdateVeiculoInput } from './veiculos.schema';

export class VeiculosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Veiculos[] >
    {
        const client = transaction ?? sql;
        return client < Veiculos[] >`
            SELECT *
            FROM "Veiculos"
            WHERE "codVeiculo" > ${ afterId }
            ORDER BY "codVeiculo"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Veiculos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Veiculos[] >`
            SELECT *
            FROM "Veiculos"
            WHERE "codVeiculo" = ${ id }
        `;

        return row ?? null;
    };

    async Create
    (
        veic:    CreateVeiculoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Veiculos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Veiculos[] >`
            INSERT INTO "Veiculos"
            (
                "placaVeiculo",
                "modeloVeiculo",
                "marca",
                "codEstado",
                "placaMercoSul",
                "codAntt",
                "codUser"
            )
            VALUES
            (
                ${ veic.placaVeiculo },
                ${ veic.modeloVeiculo ?? null },
                ${ veic.marca ?? null },
                ${ veic.codEstado ?? null },
                ${ veic.placaMercoSul ?? null },
                ${ veic.codAntt ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        veic:    UpdateVeiculoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Veiculos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Veiculos[] >`
            UPDATE "Veiculos"
            SET "placaVeiculo"  = ${ veic.placaVeiculo },
                "modeloVeiculo" = ${ veic.modeloVeiculo ?? null },
                "marca"         = ${ veic.marca ?? null },
                "codEstado"     = ${ veic.codEstado ?? null },
                "placaMercoSul" = ${ veic.placaMercoSul ?? null },
                "codAntt"       = ${ veic.codAntt ?? null },
                "codUser"       = ${ codUser },
                "dtEdicao"      = CURRENT_TIMESTAMP,
                "isActive"      = ${ veic.isActive }
            WHERE "codVeiculo" = ${ id }
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

    ): Promise < { codVeiculo: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codVeiculo: number }[] >`
            UPDATE "Veiculos"
            SET "isActive"   = false,
                "codUser"    = ${ codUser },
                "dtEdicao"   = CURRENT_TIMESTAMP
            WHERE "codVeiculo" = ${ id }
            AND "isActive"   = true
            RETURNING "codVeiculo"
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
        const [ { temDependentes } ] = await client`
            SELECT
                EXISTS ( SELECT 1 FROM "Transportadoras" WHERE "codVeiculo" = ${ id } AND "isActive" = true )
                OR
                EXISTS ( SELECT 1 FROM "VeiculoNfe"      WHERE "codVeiculo" = ${ id } )
                AS "temDependentes"
        `;

        return temDependentes as boolean;
    };
}
