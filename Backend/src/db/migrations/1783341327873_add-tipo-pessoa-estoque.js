/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Fornecedores" ADD COLUMN "tipoPessoa" VARCHAR(8);
    ALTER TABLE "Clientes"     ADD COLUMN "tipoPessoa" VARCHAR(8);
    ALTER TABLE "Produtos"     ADD COLUMN "estoque"    DECIMAL(10,3) NOT NULL DEFAULT 0;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Fornecedores" DROP COLUMN IF EXISTS "tipoPessoa";
    ALTER TABLE "Clientes"     DROP COLUMN IF EXISTS "tipoPessoa";
    ALTER TABLE "Produtos"     DROP COLUMN IF EXISTS "estoque";
  ` );
};
