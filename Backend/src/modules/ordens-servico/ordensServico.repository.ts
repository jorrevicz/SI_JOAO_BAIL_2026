import type postgres from 'postgres';
import sql from '../../lib/db';
import type OrdemDeServicos from '../../db/types/public/OrdemDeServicos';

export type CreateOrdemServicoRow = {
    codCliente:  number;
    atendente:   string;
    acessorio?:  string | null;
    defeito:     string;
    obsBalcao?:  string | null;
    tipoOdS:     string;
    solicitante?: string | null;
    codAparelho:   number;
};

export type RegistrarDiagnosticoRow = {
    historicoManutencao?: string | null;
};

export class OrdensServicoRepository
{
    async List
    (
        limit:  number,
        afterId = 0,
        codCliente?: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos[] >
    {
        const client = transaction ?? sql;

        return client < OrdemDeServicos[] >`
            SELECT *
            FROM "OrdemDeServicos"
            WHERE "numOdS" > ${ afterId }
            ${ codCliente ? client`AND "codCliente" = ${ codCliente }` : client`` }
            ORDER BY "numOdS"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        numOdS: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            SELECT *
            FROM "OrdemDeServicos"
            WHERE "numOdS" = ${ numOdS }
        `;

        return row ?? null;
    };

    async Create
    (
        os: CreateOrdemServicoRow,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            INSERT INTO "OrdemDeServicos"
            (
                "codCliente",
                "atendente",
                "acessorio",
                "defeito",
                "obsBalcao",
                "tipoOdS",
                "solicitante",
                "codAparelho",
                "codUser"
            )
            VALUES
            (
                ${ os.codCliente },
                ${ os.atendente },
                ${ os.acessorio ?? null },
                ${ os.defeito },
                ${ os.obsBalcao ?? null },
                ${ os.tipoOdS },
                ${ os.solicitante ?? null },
                ${ os.codAparelho },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async VincularEquipamento
    (
        numOdS: number,
        codEquipamento: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            UPDATE "OrdemDeServicos"
            SET "codEquipamento" = ${ codEquipamento },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP
            WHERE "numOdS" = ${ numOdS }
            AND "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    };

    async RegistrarDiagnostico
    (
        numOdS: number,
        dados:  RegistrarDiagnosticoRow,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            UPDATE "OrdemDeServicos"
            SET "historicoManutencao" = ${ dados.historicoManutencao ?? null },
                "dtAtendimento"       = COALESCE ( "dtAtendimento", CURRENT_TIMESTAMP ),
                "codUser"             = ${ codUser },
                "dtEdicao"            = CURRENT_TIMESTAMP
            WHERE "numOdS"   = ${ numOdS }
            AND "isActive"   = true
            RETURNING *
        `;

        return row ?? null;
    };

    async AtualizarObsTecnica
    (
        numOdS: number,
        obsTecnica: string | null | undefined,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            UPDATE "OrdemDeServicos"
            SET "obsTecnica" = ${ obsTecnica ?? null },
                "codUser"    = ${ codUser },
                "dtEdicao"   = CURRENT_TIMESTAMP
            WHERE "numOdS"   = ${ numOdS }
            AND "isActive"   = true
            RETURNING *
        `;

        return row ?? null;
    };

    async AtualizarSituacao
    (
        numOdS: number,
        situacao: string,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            UPDATE "OrdemDeServicos"
            SET "situacao"  = ${ situacao },
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "numOdS"  = ${ numOdS }
            AND "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        numOdS: number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { numOdS: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { numOdS: number }[] >`
            UPDATE "OrdemDeServicos"
            SET "isActive"  = false,
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "numOdS"  = ${ numOdS }
            AND "isActive"  = true
            RETURNING "numOdS"
        `;

        return row ?? null;
    };
}
