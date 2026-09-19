import type postgres from 'postgres';
import sql from '../../lib/db';
import type OrdemDeServicos from '../../db/types/public/OrdemDeServicos';

export type CreateOrdemServicoRow = {
    numOdS:      string;
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
    obsTecnica?:          string | null;
    historicoManutencao?: string | null;
};

export class OrdensServicoRepository
{
    async List
    (
        limit:  number,
        afterId = '',
        codCliente?: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos[] >
    {
        const client = transaction ?? sql;

        return client < OrdemDeServicos[] >`
            SELECT *
            FROM "OrdemDeServicos"
            WHERE "isActive" = true
            AND "numOdS" > ${ afterId }
            ${ codCliente ? client`AND "codCliente" = ${ codCliente }` : client`` }
            ORDER BY "numOdS"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        numOdS: string,
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
                "numOdS",
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
                ${ os.numOdS },
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
        numOdS: string,
        dados:  RegistrarDiagnosticoRow,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < OrdemDeServicos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < OrdemDeServicos[] >`
            UPDATE "OrdemDeServicos"
            SET "obsTecnica"          = ${ dados.obsTecnica ?? null },
                "historicoManutencao" = ${ dados.historicoManutencao ?? null },
                "dtAtendimento"       = COALESCE ( "dtAtendimento", CURRENT_TIMESTAMP ),
                "codUser"             = ${ codUser },
                "dtEdicao"            = CURRENT_TIMESTAMP
            WHERE "numOdS"   = ${ numOdS }
            AND "isActive"   = true
            RETURNING *
        `;

        return row ?? null;
    };
}
