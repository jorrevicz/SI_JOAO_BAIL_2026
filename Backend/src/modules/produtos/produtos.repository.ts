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
        codCategoria?: number,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos[] >
    {
        const client = transaction ?? sql;

        // O filtro por categoria atravessa a associativa: Produto ↔ Categoria é N:N,
        // então não há coluna em "Produtos" para comparar diretamente.
        return client < Produtos[] >`
            SELECT produto.*
            FROM "Produtos" produto
            ${
                codCategoria
                    ? client`
                        INNER JOIN "ProdutoCategoria" vinculo
                                ON vinculo."codProduto"   = produto."codProd"
                               AND vinculo."codCategoria" = ${ codCategoria }
                      `
                    : client``
            }
            WHERE produto."isActive" = true
            AND produto."codProd" > ${ afterId }
            ORDER BY produto."codProd"
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
                "undProduto",
                "pesoBruto",
                "pesoLiq",
                "estoque",
                "custoProd",
                "precoVenda",
                "codUser"
            )
            VALUES
            (
                ${ prod.produto },
                ${ prod.undProduto      ?? null },
                ${ prod.pesoBruto       ?? null },
                ${ prod.pesoLiq         ?? null },
                ${ prod.estoque         ?? 0 },
                ${ prod.custoProd       ?? 0 },
                ${ prod.precoVenda },
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
                "undProduto"   = ${ prod.undProduto   ?? null },
                "pesoBruto"    = ${ prod.pesoBruto    ?? null },
                "pesoLiq"      = ${ prod.pesoLiq      ?? null },
                "precoVenda"   = ${ prod.precoVenda },
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

    /**
     * Lê o produto ativo travando a linha (`FOR UPDATE`) até o fim da transação: o
     * lançamento/cancelamento de compra calcula o novo estoque e custo a partir desta
     * leitura, e nenhuma outra compra pode movimentar o mesmo produto no meio do caminho.
     */
    async FindByIdForUpdate
    (
        id: number,
        transaction: postgres.TransactionSql

    ): Promise < Produtos | null >
    {
        const [ row ] = await transaction < Produtos[] >`
            SELECT *
            FROM "Produtos"
            WHERE "codProd" = ${ id }
            AND "isActive" = true
            FOR UPDATE
        `;

        return row ?? null;
    };

    /**
     * Grava estoque e custos já calculados pelo service de Compras (lançamento/estorno).
     * Não faz conta: o cálculo vive no Backend (`compras.calculo.ts`), não no SQL.
     */
    async AtualizarEstoqueCusto
    (
        id:      number,
        valores: { estoque: number; custoMedioProd: string; custoProd: string },
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Produtos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Produtos[] >`
            UPDATE "Produtos"
            SET "estoque"        = ${ valores.estoque },
                "custoMedioProd" = ${ valores.custoMedioProd },
                "custoProd"      = ${ valores.custoProd },
                "codUser"        = ${ codUser },
                "dtEdicao"       = CURRENT_TIMESTAMP
            WHERE "codProd" = ${ id }
            RETURNING *
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
