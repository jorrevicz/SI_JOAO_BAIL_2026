/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Produtos"
      ALTER COLUMN "estoque" TYPE INTEGER USING "estoque"::INTEGER;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Produtos"
      ALTER COLUMN "estoque" TYPE DECIMAL(10,3) USING "estoque"::DECIMAL;
  ` );
};
