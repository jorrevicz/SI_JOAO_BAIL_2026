import type postgres from 'postgres';
import sql from '../../lib/db';
import type Categorias from '../../db/types/public/Categorias';
import type { CreateCategoriaInput, UpdateCategoriaInput } from './categorias.schema';

export class CategoriasRepository
{
    async List
    (
        limit:   number,
        afterId = 0,
        transaction?: postgres.TransactionSql

    ): Promise < Categorias[] >
    {
        const client = transaction ?? sql;
        return client < Categorias[] >`
            SELECT *
            FROM "Categorias"
            WHERE "codCategoria" > ${ afterId }
            ORDER BY "codCategoria"
            LIMIT ${ limit }
        `;
    };

    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Categorias | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Categorias[] >`
            SELECT *
            FROM "Categorias"
            WHERE "codCategoria" = ${ id }
        `;

        return row ?? null;
    };

    async Create
    (
        categoria:    CreateCategoriaInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Categorias >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Categorias[] >`
            INSERT INTO "Categorias"
            (
                "categoria",
                "codUser"
            )
            VALUES
            (
                ${ categoria.categoria },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };

    async Update
    (
        id:      number,
        categoria:    UpdateCategoriaInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Categorias | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Categorias[] >`
            UPDATE "Categorias"
            SET "categoria"     = ${ categoria.categoria },
                "codUser"       = ${ codUser },
                "dtEdicao"      = CURRENT_TIMESTAMP,
                "isActive"      = ${ categoria.isActive }
            WHERE "codCategoria"= ${ id }
            AND "isActive"      = true
            RETURNING *
        `;

        return row ?? null;
    };

    async Delete
    (
        id:      number,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < { codCategoria: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codCategoria: number }[] >`
            UPDATE "Categorias"
            SET "isActive"  = false,
                "codUser"   = ${ codUser },
                "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE "codCategoria" = ${ id }
            AND "isActive"  = true
            RETURNING "codCategoria"
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

        // O vínculo Produto ↔ Categoria vive na associativa (N:N); produto inativo não
        // bloqueia a exclusão da categoria.
        const [ row ] = await client`
            SELECT 1
            FROM "ProdutoCategoria" vinculo
            INNER JOIN "Produtos" produto
                    ON produto."codProd" = vinculo."codProduto"
            WHERE vinculo."codCategoria" = ${ id }
            AND produto."isActive" = true
            LIMIT 1
        `;

        return !!row;
    };
}
