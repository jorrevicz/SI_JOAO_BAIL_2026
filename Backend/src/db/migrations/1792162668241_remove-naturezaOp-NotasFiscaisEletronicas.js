/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => { pgm.sql(`
  ALTER TABLE "NotasFiscaisEletronicas" DROP COLUMN "naturezaOp";
`) };

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`
  ALTER TABLE "NotasFiscaisEletronicas" ADD COLUMN "naturezaOp" VARCHAR(60);
  UPDATE "NotasFiscaisEletronicas" SET "naturezaOp" = 'Compra para comercialização';
  ALTER TABLE "NotasFiscaisEletronicas" ALTER COLUMN "naturezaOp" SET NOT NULL;
`) };
