import type postgres from 'postgres';
import sql from '../../lib/db';
import type Produtos from '../../db/types/public/Produtos';
import type { CreateProdutoInput, UpdateProdutoInput } from './produtos.schema';

export class ProdutosRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos[] >
    {
        const client = transaction ?? sql;
        return client < Produtos[] >`
            SELECT *
            FROM "Produtos"
            WHERE "isActive" = true
            AND "codProd" > ${ afterId }
            ORDER BY "codProd"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Produtos[] >`
            SELECT *
            FROM "Produtos"
            WHERE "codProd" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        prod:    CreateProdutoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Produtos[] >`
            INSERT INTO "Produtos"
            (
                "produto",
                "codCategoria",
                "undProduto",
                "pesoBruto",
                "pesoLiq",
                "estoque",
                "custoMedioProd",
                "codUser"
            )
            VALUES
            (
                ${ prod.produto },
                ${ prod.codCategoria    ?? null },
                ${ prod.undProduto      ?? null },
                ${ prod.pesoBruto       ?? null },
                ${ prod.pesoLiq         ?? null },
                ${ prod.estoque         ?? 0 },
                ${ prod.custo           ?? 0 },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        prod:    UpdateProdutoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Produtos[] >`
            UPDATE "Produtos"
            SET "produto"      = ${ prod.produto },
                "codCategoria" = ${ prod.codCategoria ?? null },
                "undProduto"   = ${ prod.undProduto   ?? null },
                "pesoBruto"    = ${ prod.pesoBruto    ?? null },
                "pesoLiq"      = ${ prod.pesoLiq      ?? null },
                "codUser"      = ${ codUser },
                "dtEdicao"     = CURRENT_TIMESTAMP,
                "isActive"     = ${ prod.isActive }
            WHERE "codProd" = ${ id }
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

    ): Promise < { codProd: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codProd: number }[] >`
            UPDATE "Produtos"
            SET "isActive"  = false,
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "codProd" = ${ id }
            AND "isActive"  = true
            RETURNING "codProd"
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
            FROM "CompraProduto"
            WHERE "codProduto" = ${ id }
            LIMIT 1
        `;

        if ( row ) return true;

        const [ rowNfe ] = await client`
            SELECT 1
            FROM "ProdutoNfe"
            WHERE "codProduto" = ${ id }
            LIMIT 1
        `;

        return !!rowNfe;
    };
}
