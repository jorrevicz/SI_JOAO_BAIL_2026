/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Equaliza Transportadoras com Clientes e Fornecedores: contato (CEP, bairro, celular,
 * telefone fixo, e-mail) e dados pessoais por tipo de pessoa (apelido, RG, nascimento e
 * gênero na física; data de fundação na jurídica). Colunas nascem opcionais (registros
 * pré-existentes não têm o dado); a obrigatoriedade é validada no Backend (Zod).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Transportadoras"
      ADD COLUMN "bairroTransp" VARCHAR(100),
      ADD COLUMN "cepTransp"    VARCHAR(8),
      ADD COLUMN "foneTransp"   VARCHAR(15),
      ADD COLUMN "foneFixo"     VARCHAR(15),
      ADD COLUMN "email"        VARCHAR(254),
      ADD COLUMN "apelido"      VARCHAR(60),
      ADD COLUMN "rg"           VARCHAR(20),
      ADD COLUMN "dtNascimento" DATE,
      ADD COLUMN "dtFundacao"   DATE,
      ADD COLUMN "genero"       "Genero";
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Transportadoras"
      DROP COLUMN "genero",
      DROP COLUMN "dtFundacao",
      DROP COLUMN "dtNascimento",
      DROP COLUMN "rg",
      DROP COLUMN "apelido",
      DROP COLUMN "email",
      DROP COLUMN "foneFixo",
      DROP COLUMN "foneTransp",
      DROP COLUMN "cepTransp",
      DROP COLUMN "bairroTransp";
  ` );
};
