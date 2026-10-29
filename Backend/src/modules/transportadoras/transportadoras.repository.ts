import type postgres from 'postgres';
import sql from '../../lib/db';
import type Transportadoras from '../../db/types/public/Transportadoras';
import type { CreateTransportadoraInput, UpdateTransportadoraInput } from './transportadoras.schema';

export class TransportadorasRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Transportadoras[] >
    {
        const client = transaction ?? sql;
        return client < Transportadoras[] >`
            SELECT *
            FROM "Transportadoras"
            WHERE "codTransp" > ${ afterId }
            ORDER BY "codTransp"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Transportadoras | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Transportadoras[] >`
            SELECT *
            FROM "Transportadoras"
            WHERE "codTransp" = ${ id }
        `;

        return row ?? null;
    };

    async Create
    (
        trasp:    CreateTransportadoraInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Transportadoras >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Transportadoras[] >`
            INSERT INTO "Transportadoras"
            (
                "codCidade",
                "transportadora",
                "codVeiculo",
                "nomeFantasia",
                "tipoPessoa",
                "enderecoTransp",
                "numeroTransp",
                "cpfCnpjTransp",
                "inscEstTransp",
                "bairroTransp",
                "cepTransp",
                "foneTransp",
                "foneFixo",
                "email",
                "apelido",
                "rg",
                "dtNascimento",
                "dtFundacao",
                "genero",
                "codUser"
            )
            VALUES
            (
                ${ trasp.codCidade },
                ${ trasp.transportadora },
                ${ trasp.codVeiculo      ?? null },
                ${ trasp.nomeFantasia    ?? null },
                ${ trasp.tipoPessoa      ?? null },
                ${ trasp.enderecoTransp  ?? null },
                ${ trasp.numeroTransp    ?? null },
                ${ trasp.cpfCnpjTransp   ?? null },
                ${ trasp.inscEstTransp   ?? null },
                ${ trasp.bairroTransp    ?? null },
                ${ trasp.cepTransp       ?? null },
                ${ trasp.foneTransp      ?? null },
                ${ trasp.foneFixo        ?? null },
                ${ trasp.email           ?? null },
                ${ trasp.apelido         ?? null },
                ${ trasp.rg              ?? null },
                ${ trasp.dtNascimento    ?? null },
                ${ trasp.dtFundacao      ?? null },
                ${ trasp.genero          ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        trasp:    UpdateTransportadoraInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Transportadoras | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Transportadoras[] >`
            UPDATE "Transportadoras"
            SET "codCidade"      = ${ trasp.codCidade },
                "transportadora" = ${ trasp.transportadora },
                "codVeiculo"     = ${ trasp.codVeiculo      ?? null },
                "nomeFantasia"   = ${ trasp.nomeFantasia    ?? null },
                "tipoPessoa"     = ${ trasp.tipoPessoa      ?? null },
                "enderecoTransp" = ${ trasp.enderecoTransp  ?? null },
                "numeroTransp"   = ${ trasp.numeroTransp    ?? null },
                "cpfCnpjTransp"  = ${ trasp.cpfCnpjTransp   ?? null },
                "inscEstTransp"  = ${ trasp.inscEstTransp   ?? null },
                "bairroTransp"   = ${ trasp.bairroTransp    ?? null },
                "cepTransp"      = ${ trasp.cepTransp       ?? null },
                "foneTransp"     = ${ trasp.foneTransp      ?? null },
                "foneFixo"       = ${ trasp.foneFixo        ?? null },
                "email"          = ${ trasp.email           ?? null },
                "apelido"        = ${ trasp.apelido         ?? null },
                "rg"             = ${ trasp.rg              ?? null },
                "dtNascimento"   = ${ trasp.dtNascimento    ?? null },
                "dtFundacao"     = ${ trasp.dtFundacao      ?? null },
                "genero"         = ${ trasp.genero          ?? null },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP,
                "isActive"       = ${ trasp.isActive }
            WHERE "codTransp" = ${ id }
            AND "isActive"    = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codTransp: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codTransp: number }[] >`
            UPDATE "Transportadoras"
            SET "isActive"   = false,
                "codUser"    = ${ codUser },
                "dtEdicao"   = CURRENT_TIMESTAMP
            WHERE "codTransp" = ${ id }
            AND "isActive"   = true
            RETURNING "codTransp"
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
        // A NF-e não referencia a transportadora diretamente: o transporte vem da compra.
        const [ { temDependentes } ] = await client`
            SELECT
                EXISTS ( SELECT 1 FROM "Compras" WHERE "codTransp" = ${ id } AND "isActive" = true )
                AS "temDependentes"
        `;

        return temDependentes as boolean;
    };
}
