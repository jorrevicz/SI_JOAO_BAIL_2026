/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Valores calculados pelo Backend deixam de ser persistidos (3FN): derivam de colunas que
 * já existem e são devolvidos ao Frontend a cada leitura (`compras.calculo.ts`).
 *
 * - "Compras"."vlrTotal": derivado dos itens (quantidade, valorUnitario, desconto);
 * - "CompraProduto"."percentualRateio" / "valorRateio" / "custoMedioProduto": derivados
 *   dos itens da compra e de frete/seguro/despesas.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            DROP COLUMN "vlrTotal";

        ALTER TABLE "CompraProduto"
            DROP COLUMN "percentualRateio",
            DROP COLUMN "valorRateio",
            DROP COLUMN "custoMedioProduto";
    ` );
};

/**
 * Recria as colunas. "vlrTotal" é refeito como total dos produtos (Σ líquidos); os campos
 * de rateio voltam zerados e o custo do item volta como o líquido unitário — aproximação,
 * já que o cálculo oficial vive no Backend.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            ADD COLUMN "vlrTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

        UPDATE "Compras" compra
        SET    "vlrTotal" = COALESCE ( ( SELECT SUM ( item."quantidade" * item."valorUnitario" - item."desconto" )
                                         FROM   "CompraProduto" item
                                         WHERE  item."numero"  = compra."numero"
                                         AND    item."modelo"  = compra."modelo"
                                         AND    item."serie"   = compra."serie"
                                         AND    item."codForn" = compra."codForn" ), 0 );

        ALTER TABLE "Compras"
            ALTER COLUMN "vlrTotal" DROP DEFAULT;

        ALTER TABLE "CompraProduto"
            ADD COLUMN "percentualRateio"  DECIMAL(5,2)  NOT NULL DEFAULT 0,
            ADD COLUMN "valorRateio"       DECIMAL(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN "custoMedioProduto" DECIMAL(10,2);

        UPDATE "CompraProduto"
        SET    "custoMedioProduto" = ROUND ( ( "quantidade" * "valorUnitario" - "desconto" ) / "quantidade", 2 );

        ALTER TABLE "CompraProduto"
            ALTER COLUMN "custoMedioProduto" SET NOT NULL;
    ` );
};
