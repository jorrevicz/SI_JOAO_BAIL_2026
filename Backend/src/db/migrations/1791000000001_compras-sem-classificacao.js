/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * A compra deixa de ter classificação de propósito (`codClassificacaoCompra`, criada em
 * `classificacoes-compra`): coluna, índice e FK saem de "Compras". A tabela de domínio
 * "ClassificacoesCompra" continua existindo, só não é mais referenciada pela compra.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            DROP CONSTRAINT "Compras_codClassificacaoCompra_fkey";

        DROP INDEX "Compras_codClassificacaoCompra_idx";

        ALTER TABLE "Compras"
            DROP COLUMN "codClassificacaoCompra";
    ` );
};

/**
 * Recria a coluna obrigatória; as compras existentes voltam classificadas como
 * 'revenda' (valor semeado em "ClassificacoesCompra").
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            ADD COLUMN "codClassificacaoCompra" INTEGER;

        UPDATE "Compras"
        SET    "codClassificacaoCompra" =
               ( SELECT "codClassificacaoCompra"
                 FROM   "ClassificacoesCompra"
                 WHERE  "classificacaoCompra" = 'revenda' );

        ALTER TABLE "Compras"
            ALTER COLUMN "codClassificacaoCompra" SET NOT NULL;

        CREATE INDEX "Compras_codClassificacaoCompra_idx"
            ON "Compras" ( "codClassificacaoCompra" );

        ALTER TABLE "Compras"
            ADD CONSTRAINT "Compras_codClassificacaoCompra_fkey"
            FOREIGN KEY ( "codClassificacaoCompra" )
            REFERENCES "ClassificacoesCompra" ( "codClassificacaoCompra" )
            ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};
