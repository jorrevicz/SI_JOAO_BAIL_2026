/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * O número do documento fiscal (`numero`, parte da chave natural `numero`/`modelo`/`serie`)
 * passa de 8 para 9 dígitos — tamanho do número da NF-e. Vale para todas as tabelas que
 * usam essa chave: "Compras" (e "CompraProduto", que a referencia), "ContasAPagar" e
 * "ContasAReceber".
 *
 * Backfill: os números já gravados (8 dígitos) ganham um zero à esquerda, mantendo o
 * formato "só dígitos com zeros à esquerda" exigido pelo `documentoFiscalSchema`. A FK
 * "CompraProduto_compra_fkey" é ON UPDATE CASCADE, então atualizar "Compras" já
 * propaga o novo número aos itens.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"        ALTER COLUMN "numero" TYPE VARCHAR(9);
        ALTER TABLE "CompraProduto"  ALTER COLUMN "numero" TYPE VARCHAR(9);
        ALTER TABLE "ContasAPagar"   ALTER COLUMN "numero" TYPE VARCHAR(9);
        ALTER TABLE "ContasAReceber" ALTER COLUMN "numero" TYPE VARCHAR(9);

        UPDATE "Compras"        SET "numero" = LPAD ( "numero", 9, '0' ) WHERE LENGTH ( "numero" ) < 9;
        UPDATE "ContasAPagar"   SET "numero" = LPAD ( "numero", 9, '0' ) WHERE LENGTH ( "numero" ) < 9;
        UPDATE "ContasAReceber" SET "numero" = LPAD ( "numero", 9, '0' ) WHERE LENGTH ( "numero" ) < 9;
    ` );
};

/**
 * Remove o zero à esquerda acrescentado no `up`. Números de 9 dígitos que não começam
 * com zero não cabem em VARCHAR(8) — o ALTER falha e a migration não é revertida.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        UPDATE "Compras"        SET "numero" = SUBSTRING ( "numero" FROM 2 ) WHERE LENGTH ( "numero" ) = 9 AND LEFT ( "numero", 1 ) = '0';
        UPDATE "ContasAPagar"   SET "numero" = SUBSTRING ( "numero" FROM 2 ) WHERE LENGTH ( "numero" ) = 9 AND LEFT ( "numero", 1 ) = '0';
        UPDATE "ContasAReceber" SET "numero" = SUBSTRING ( "numero" FROM 2 ) WHERE LENGTH ( "numero" ) = 9 AND LEFT ( "numero", 1 ) = '0';

        ALTER TABLE "ContasAReceber" ALTER COLUMN "numero" TYPE VARCHAR(8);
        ALTER TABLE "ContasAPagar"   ALTER COLUMN "numero" TYPE VARCHAR(8);
        ALTER TABLE "CompraProduto"  ALTER COLUMN "numero" TYPE VARCHAR(8);
        ALTER TABLE "Compras"        ALTER COLUMN "numero" TYPE VARCHAR(8);
    ` );
};
