/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Equaliza os dados de identificação de Clientes e Fornecedores:
 *  - Clientes ganha CPF/CNPJ (cpfCnpjCl) e inscrição estadual (inscEstCl), como Fornecedores;
 *  - Fornecedores ganha RG (pessoa física), como Clientes.
 * Colunas nascem opcionais (registros pré-existentes não têm o dado); a obrigatoriedade
 * é validada no Backend (Zod).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Clientes"
      ADD COLUMN "cpfCnpjCl" VARCHAR(14),
      ADD COLUMN "inscEstCl" VARCHAR(15);

    ALTER TABLE "Fornecedores"
      ADD COLUMN "rg" VARCHAR(20);
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Fornecedores" DROP COLUMN "rg";

    ALTER TABLE "Clientes"
      DROP COLUMN "inscEstCl",
      DROP COLUMN "cpfCnpjCl";
  ` );
};
