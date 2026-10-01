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
    codEquipamento: number;
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
            WHERE "isActive" = true
            ${ afterId ? client`AND "numOdS" > ${ afterId }` : client`` }
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
            AND "isActive" = true
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
                "codEquipamento",
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
                ${ os.codEquipamento },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
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
}
