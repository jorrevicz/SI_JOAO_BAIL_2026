/**
 * Custos do produto com 6 casas decimais.
 *
 * - "Produtos"."custoProd" e "Produtos"."custoMedioProd" passam de DECIMAL(10,2) para
 *   DECIMAL(16,6): o custo unitário vindo das compras (líquido + rateio ÷ quantidade) e a
 *   média ponderada não podem ser truncados em centavos ao serem persistidos.
 * - O alargamento é sem perda: os valores existentes ganham zeros à direita.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => { pgm.sql(`
  ALTER TABLE "Produtos"
    ALTER COLUMN "custoProd"      TYPE DECIMAL(16,6),
    ALTER COLUMN "custoMedioProd" TYPE DECIMAL(16,6);
`) };

/**
 * Reverter arredonda para centavos (perde as casas além da segunda).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`
  ALTER TABLE "Produtos"
    ALTER COLUMN "custoProd"      TYPE DECIMAL(10,2),
    ALTER COLUMN "custoMedioProd" TYPE DECIMAL(10,2);
`) };
