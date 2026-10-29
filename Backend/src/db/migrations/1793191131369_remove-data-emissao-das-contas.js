/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Remove `dtEmissao` de ContasAPagar e ContasAReceber: como a conta nasce já baixada
 * (migration `contas-nascem-baixadas`), a data da baixa (`dtBaixa`) passa a ocupar o
 * lugar da data de emissão, que deixa de existir na conta.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAPagar"   DROP COLUMN "dtEmissao";
    ALTER TABLE "ContasAReceber" DROP COLUMN "dtEmissao";
  ` );
};

/**
 * Recria `dtEmissao` NOT NULL, preenchida a partir de `dtBaixa` nos registros existentes.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAPagar"   ADD COLUMN "dtEmissao" TIMESTAMPTZ(3);
    UPDATE "ContasAPagar"   SET "dtEmissao" = "dtBaixa";
    ALTER TABLE "ContasAPagar"   ALTER COLUMN "dtEmissao" SET NOT NULL;

    ALTER TABLE "ContasAReceber" ADD COLUMN "dtEmissao" TIMESTAMPTZ(3);
    UPDATE "ContasAReceber" SET "dtEmissao" = "dtBaixa";
    ALTER TABLE "ContasAReceber" ALTER COLUMN "dtEmissao" SET NOT NULL;
  ` );
};
