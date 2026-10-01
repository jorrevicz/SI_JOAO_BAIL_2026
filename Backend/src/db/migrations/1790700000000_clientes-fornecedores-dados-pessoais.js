/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Dados complementares de Clientes e Fornecedores, que dependem do tipo da pessoa:
 *  - FISICA:   apelido, data de nascimento, gênero (e RG, só em Clientes);
 *  - JURIDICA: nome fantasia (já existia em Fornecedores) e data de fundação.
 * Telefone fixo e e-mail valem para os dois tipos. Todas as colunas nascem opcionais
 * (registros pré-existentes não têm o dado); a obrigatoriedade condicional ao
 * tipoPessoa é validada no Backend (Zod).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    CREATE TYPE "Genero" AS ENUM ( 'MASCULINO', 'FEMININO', 'OUTRO' );

    ALTER TABLE "Clientes"
      ADD COLUMN "apelido"      VARCHAR(60),
      ADD COLUMN "nomeFantasia" VARCHAR(60),
      ADD COLUMN "rg"           VARCHAR(20),
      ADD COLUMN "dtNascimento" DATE,
      ADD COLUMN "dtFundacao"   DATE,
      ADD COLUMN "genero"       "Genero",
      ADD COLUMN "foneFixo"     VARCHAR(15),
      ADD COLUMN "email"        VARCHAR(254);

    ALTER TABLE "Fornecedores"
      ADD COLUMN "apelido"      VARCHAR(60),
      ADD COLUMN "dtNascimento" DATE,
      ADD COLUMN "dtFundacao"   DATE,
      ADD COLUMN "genero"       "Genero",
      ADD COLUMN "foneFixo"     VARCHAR(15),
      ADD COLUMN "email"        VARCHAR(254);
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Fornecedores"
      DROP COLUMN "email",
      DROP COLUMN "foneFixo",
      DROP COLUMN "genero",
      DROP COLUMN "dtFundacao",
      DROP COLUMN "dtNascimento",
      DROP COLUMN "apelido";

    ALTER TABLE "Clientes"
      DROP COLUMN "email",
      DROP COLUMN "foneFixo",
      DROP COLUMN "genero",
      DROP COLUMN "dtFundacao",
      DROP COLUMN "dtNascimento",
      DROP COLUMN "rg",
      DROP COLUMN "nomeFantasia",
      DROP COLUMN "apelido";

    DROP TYPE "Genero";
  ` );
};
