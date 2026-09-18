import type postgres from 'postgres';
import sql from '../../lib/db';

/**
 * Vínculo Produto ↔ Categoria com o nome da categoria resolvido pelo JOIN — poupa o
 * formulário de montar um mapa de código → nome só para exibir a lista.
 */
export interface VinculoProdutoCategoria
{
    codProduto:   number;
    codCategoria: number;
    categoria:    string;
}

/**
 * "ProdutoCategoria" é uma associativa de FKs puras: não tem PK substituta, nem colunas
 * de auditoria, nem "isActive". Por isso não há Update (não existe payload para alterar)
 * e a remoção é DELETE físico — o histórico que o soft delete protege vive em "Produtos"
 * e "Categorias", que permanecem intactos.
 */
export class ProdutoCategoriasRepository
{
    /**
     * O cursor conta **produtos**, não linhas: um produto com várias categorias traria
     * suas linhas partidas entre duas páginas se o LIMIT fosse aplicado direto sobre a
     * associativa, e a página seguinte perderia as linhas restantes (o cursor já teria
     * avançado). A subconsulta escolhe os próximos `limit` produtos e só então as linhas
     * deles são devolvidas, inteiras.
     */
    async List
    (
        limit: number,
        afterId = 0,
        codProduto?: number,
        transaction?: postgres.TransactionSql
    ): Promise < VinculoProdutoCategoria[] >
    {
        const client = transaction ?? sql;

        return client < VinculoProdutoCategoria[] >`
            SELECT      vinculo."codProduto",
                        vinculo."codCategoria",
                        categoria."categoria"
            FROM        "ProdutoCategoria" vinculo
            INNER JOIN  "Categorias" categoria
                    ON  categoria."codCategoria" = vinculo."codCategoria"
            WHERE       categoria."isActive" = true
            AND         vinculo."codProduto" IN
            (
                SELECT   DISTINCT "codProduto"
                FROM     "ProdutoCategoria"
                WHERE    "codProduto" > ${ afterId }
                ${ codProduto ? client`AND "codProduto" = ${ codProduto }` : client`` }
                ORDER BY "codProduto"
                LIMIT    ${ limit }
            )
            ORDER BY    vinculo."codProduto", vinculo."codCategoria"
        `;
    }

    async ListByProduto
    (
        codProduto: number,
        transaction?: postgres.TransactionSql
    ): Promise < VinculoProdutoCategoria[] >
    {
        const client = transaction ?? sql;

        return client < VinculoProdutoCategoria[] >`
            SELECT      vinculo."codProduto",
                        vinculo."codCategoria",
                        categoria."categoria"
            FROM        "ProdutoCategoria" vinculo
            INNER JOIN  "Categorias" categoria
                    ON  categoria."codCategoria" = vinculo."codCategoria"
            WHERE       vinculo."codProduto" = ${ codProduto }
            ORDER BY    vinculo."codCategoria"
        `;
    }

    async FindPair
    (
        codProduto:   number,
        codCategoria: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codProduto: number; codCategoria: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codProduto: number; codCategoria: number }[] >`
            SELECT "codProduto", "codCategoria"
            FROM   "ProdutoCategoria"
            WHERE  "codProduto"   = ${ codProduto }
            AND    "codCategoria" = ${ codCategoria }
        `;

        return row ?? null;
    }

    async Create
    (
        codProduto:   number,
        codCategoria: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codProduto: number; codCategoria: number } >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codProduto: number; codCategoria: number }[] >`
            INSERT INTO "ProdutoCategoria"
            (
                "codProduto",
                "codCategoria"
            )
            VALUES
            (
                ${ codProduto },
                ${ codCategoria }
            )
            RETURNING "codProduto", "codCategoria"
        `;

        return row;
    }

    async Delete
    (
        codProduto:   number,
        codCategoria: number,
        transaction?: postgres.TransactionSql
    ): Promise < { codProduto: number; codCategoria: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { codProduto: number; codCategoria: number }[] >`
            DELETE FROM "ProdutoCategoria"
            WHERE  "codProduto"   = ${ codProduto }
            AND    "codCategoria" = ${ codCategoria }
            RETURNING "codProduto", "codCategoria"
        `;

        return row ?? null;
    }

    async DeleteByProduto
    (
        codProduto: number,
        transaction?: postgres.TransactionSql
    ): Promise < void >
    {
        const client = transaction ?? sql;

        await client`
            DELETE FROM "ProdutoCategoria"
            WHERE  "codProduto" = ${ codProduto }
        `;
    }
}
