/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * O documento deixa de ser identificado só por (`numero`, `modelo`, `serie`): o mesmo
 * número de nota pode existir para emitentes diferentes, então o parceiro entra na chave
 * natural composta:
 *
 * - "Compras"        → (`numero`, `modelo`, `serie`, `codForn`)
 * - "CompraProduto"  → (`numero`, `modelo`, `serie`, `codForn`, `codProduto`), com a FK
 *                      composta para "Compras" acompanhando a nova chave;
 * - "ContasAPagar"   → (`numero`, `modelo`, `serie`, `codFornecedor`, `parcela`);
 * - "ContasAReceber" → (`numero`, `modelo`, `serie`, `codCliente`, `parcela`).
 *
 * `parcela` já fazia parte da chave das duas tabelas de contas.
 *
 * Backfill de "CompraProduto": a coluna `codForn` é preenchida a partir da compra de
 * origem (a FK antiga garante que ela existe) antes de virar NOT NULL.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "CompraProduto" DROP CONSTRAINT "CompraProduto_compra_fkey";
        ALTER TABLE "CompraProduto" DROP CONSTRAINT "CompraProduto_pkey";
        ALTER TABLE "Compras"       DROP CONSTRAINT "Compras_pkey";

        ALTER TABLE "Compras"
            ADD CONSTRAINT "Compras_pkey" PRIMARY KEY ( "numero", "modelo", "serie", "codForn" );

        ALTER TABLE "CompraProduto" ADD COLUMN "codForn" INTEGER;

        UPDATE "CompraProduto" item
        SET    "codForn" = compra."codForn"
        FROM   "Compras" compra
        WHERE  compra."numero" = item."numero"
        AND    compra."modelo" = item."modelo"
        AND    compra."serie"  = item."serie";

        ALTER TABLE "CompraProduto" ALTER COLUMN "codForn" SET NOT NULL;

        ALTER TABLE "CompraProduto"
            ADD CONSTRAINT "CompraProduto_pkey"
            PRIMARY KEY ( "numero", "modelo", "serie", "codForn", "codProduto" );

        ALTER TABLE "CompraProduto"
            ADD CONSTRAINT "CompraProduto_compra_fkey"
            FOREIGN KEY ( "numero", "modelo", "serie", "codForn" )
            REFERENCES "Compras" ( "numero", "modelo", "serie", "codForn" )
            ON DELETE RESTRICT ON UPDATE CASCADE;

        ALTER TABLE "ContasAPagar"   DROP CONSTRAINT "ContasAPagar_pkey";
        ALTER TABLE "ContasAPagar"
            ADD CONSTRAINT "ContasAPagar_pkey"
            PRIMARY KEY ( "numero", "modelo", "serie", "codFornecedor", "parcela" );

        ALTER TABLE "ContasAReceber" DROP CONSTRAINT "ContasAReceber_pkey";
        ALTER TABLE "ContasAReceber"
            ADD CONSTRAINT "ContasAReceber_pkey"
            PRIMARY KEY ( "numero", "modelo", "serie", "codCliente", "parcela" );
    ` );
};

/**
 * Volta à chave sem o parceiro. Falha se, no meio tempo, passou a existir mais de um
 * documento com o mesmo (`numero`, `modelo`, `serie`) — a chave antiga não comporta isso.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "ContasAReceber" DROP CONSTRAINT "ContasAReceber_pkey";
        ALTER TABLE "ContasAReceber"
            ADD CONSTRAINT "ContasAReceber_pkey" PRIMARY KEY ( "numero", "modelo", "serie", "parcela" );

        ALTER TABLE "ContasAPagar"   DROP CONSTRAINT "ContasAPagar_pkey";
        ALTER TABLE "ContasAPagar"
            ADD CONSTRAINT "ContasAPagar_pkey" PRIMARY KEY ( "numero", "modelo", "serie", "parcela" );

        ALTER TABLE "CompraProduto" DROP CONSTRAINT "CompraProduto_compra_fkey";
        ALTER TABLE "CompraProduto" DROP CONSTRAINT "CompraProduto_pkey";
        ALTER TABLE "Compras"       DROP CONSTRAINT "Compras_pkey";

        ALTER TABLE "CompraProduto" DROP COLUMN "codForn";

        ALTER TABLE "Compras"
            ADD CONSTRAINT "Compras_pkey" PRIMARY KEY ( "numero", "modelo", "serie" );

        ALTER TABLE "CompraProduto"
            ADD CONSTRAINT "CompraProduto_pkey"
            PRIMARY KEY ( "numero", "modelo", "serie", "codProduto" );

        ALTER TABLE "CompraProduto"
            ADD CONSTRAINT "CompraProduto_compra_fkey"
            FOREIGN KEY ( "numero", "modelo", "serie" )
            REFERENCES "Compras" ( "numero", "modelo", "serie" )
            ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};
