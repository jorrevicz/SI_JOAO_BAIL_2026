/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Remove `dtPagamento` de ContasAReceber: a conta nasce já baixada e `dtBaixa` já
 * registra a data em que o título foi quitado, então a data de pagamento era redundante.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `ALTER TABLE "ContasAReceber" DROP COLUMN "dtPagamento";` );
};

/**
 * Recria `dtPagamento` NOT NULL, preenchida a partir de `dtBaixa`.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAReceber" ADD COLUMN "dtPagamento" TIMESTAMPTZ(3);
    UPDATE "ContasAReceber" SET "dtPagamento" = "dtBaixa";
    ALTER TABLE "ContasAReceber" ALTER COLUMN "dtPagamento" SET NOT NULL;
  ` );
};
