/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    CREATE UNIQUE INDEX "Paises_ddi_key"    ON "Paises"  ("ddi");
    CREATE UNIQUE INDEX "Estados_codPais_uf_key" ON "Estados" ("codPais", "uf");
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    DROP INDEX IF EXISTS "Paises_ddi_key";
    DROP INDEX IF EXISTS "Estados_codPais_uf_key";
  ` );
};
