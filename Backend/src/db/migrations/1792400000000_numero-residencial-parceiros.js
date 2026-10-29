/**
 * Número residencial no endereço de Fornecedores, Clientes e Transportadoras.
 *
 * - Nova coluna inteira, opcional como o próprio endereço, com o sufixo de cada tabela:
 *   "Fornecedores"."numeroForn", "Clientes"."numeroCl", "Transportadoras"."numeroTransp".
 * - CHECK garante número positivo quando informado (a validação de formato fica no Zod).
 * - Registros pré-existentes ficam com NULL (sem número informado).
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
  ALTER TABLE "Fornecedores"
    ADD COLUMN "numeroForn" INTEGER,
    ADD CONSTRAINT "Fornecedores_numeroForn_check" CHECK ( "numeroForn" > 0 );

  ALTER TABLE "Clientes"
    ADD COLUMN "numeroCl" INTEGER,
    ADD CONSTRAINT "Clientes_numeroCl_check" CHECK ( "numeroCl" > 0 );

  ALTER TABLE "Transportadoras"
    ADD COLUMN "numeroTransp" INTEGER,
    ADD CONSTRAINT "Transportadoras_numeroTransp_check" CHECK ( "numeroTransp" > 0 );
`) };

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`
  ALTER TABLE "Transportadoras" DROP COLUMN "numeroTransp";
  ALTER TABLE "Clientes"        DROP COLUMN "numeroCl";
  ALTER TABLE "Fornecedores"    DROP COLUMN "numeroForn";
`) };
