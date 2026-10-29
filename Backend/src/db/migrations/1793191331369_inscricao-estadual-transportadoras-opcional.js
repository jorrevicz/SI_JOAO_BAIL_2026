/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * `Transportadoras.inscEstTransp` volta a ser opcional: nem toda transportadora
 * (principalmente pessoa física) possui inscrição estadual. Os valores já gravados
 * (inclusive o preenchimento '000000000000' do backfill de `campos-obrigatorios`) são mantidos.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `ALTER TABLE "Transportadoras" ALTER COLUMN "inscEstTransp" DROP NOT NULL;` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    UPDATE "Transportadoras" SET "inscEstTransp" = '000000000000' WHERE "inscEstTransp" IS NULL;
    ALTER TABLE "Transportadoras" ALTER COLUMN "inscEstTransp" SET NOT NULL;
  ` );
};
