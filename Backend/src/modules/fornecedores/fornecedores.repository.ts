import type postgres from 'postgres';
import sql from '../../lib/db';
import type Fornecedores from '../../db/types/public/Fornecedores';
import type { CreateFornecedorInput, UpdateFornecedorInput } from './fornecedores.schema';

export class FornecedoresRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Fornecedores[] >
    {
        const client = transaction ?? sql;
        return client < Fornecedores[] >`
            SELECT *
            FROM "Fornecedores"
            WHERE "isActive" = true
            AND "codForn" > ${ afterId }
            ORDER BY "codForn"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Fornecedores | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Fornecedores[] >`
            SELECT *
            FROM "Fornecedores"
            WHERE "codForn" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        forn:    CreateFornecedorInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Fornecedores >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Fornecedores[] >`
            INSERT INTO "Fornecedores"
            (
                "codCidade",
                "codCondDePag",
                "fornecedor",
                "nomeFantasia",
                "tipoPessoa",
                "enderecoForn",
                "bairroForn",
                "cepForn",
                "foneForn",
                "cpfCnpjForn",
                "inscEstSubTrib",
                "codUser"
            )
            VALUES
            (
                ${ forn.codCidade },
                ${ forn.codCondDePag },
                ${ forn.fornecedor },
                ${ forn.nomeFantasia    ?? null },
                ${ forn.tipoPessoa      ?? null },
                ${ forn.enderecoForn    ?? null },
                ${ forn.bairroForn      ?? null },
                ${ forn.cepForn         ?? null },
                ${ forn.foneForn        ?? null },
                ${ forn.cpfCnpjForn     ?? null },
                ${ forn.inscEstSubTrib  ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        forn:    UpdateFornecedorInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Fornecedores | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Fornecedores[] >`
            UPDATE "Fornecedores"
            SET "codCidade"      = ${ forn.codCidade },
                "codCondDePag"   = ${ forn.codCondDePag },
                "fornecedor"     = ${ forn.fornecedor },
                "nomeFantasia"   = ${ forn.nomeFantasia    ?? null },
                "tipoPessoa"     = ${ forn.tipoPessoa      ?? null },
                "enderecoForn"   = ${ forn.enderecoForn    ?? null },
                "bairroForn"     = ${ forn.bairroForn      ?? null },
                "cepForn"        = ${ forn.cepForn         ?? null },
                "foneForn"       = ${ forn.foneForn        ?? null },
                "cpfCnpjForn"    = ${ forn.cpfCnpjForn     ?? null },
                "inscEstSubTrib" = ${ forn.inscEstSubTrib  ?? null },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP,
                "isActive"       = ${ forn.isActive }
            WHERE "codForn" = ${ id }
            AND "isActive"  = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codForn: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codForn: number }[] >`
            UPDATE "Fornecedores"
            SET "isActive"  = false,
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "codForn" = ${ id }
            AND "isActive"  = true
            RETURNING "codForn"
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
                EXISTS ( SELECT 1 FROM "Compras"                 WHERE "codForn"       = ${ id } AND "isActive" = true )
                OR
                EXISTS ( SELECT 1 FROM "ProdutoFornecedor"       WHERE "codForn"       = ${ id } )
                OR
                EXISTS ( SELECT 1 FROM "ContasAPagar"            WHERE "codFornecedor" = ${ id } AND "isActive" = true )
                OR
                EXISTS ( SELECT 1 FROM "NotasFiscaisEletronicas" WHERE "codFornecedor" = ${ id } AND "isActive" = true )
                OR
                EXISTS ( SELECT 1 FROM "VeiculoNfe"              WHERE "codForn"       = ${ id } )
                AS "temDependentes"
        `;

        return temDependentes as boolean;
    };
}
