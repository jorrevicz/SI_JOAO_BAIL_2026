/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Torna obrigatórias (NOT NULL) a data de emissão e a data de vencimento de
 * ContasAPagar e ContasAReceber — eram opcionais, mas a checagem cruzada
 * (vencimento não pode ser anterior à emissão) só faz sentido com as duas
 * datas sempre presentes. Registros existentes com valor nulo são preenchidos
 * a partir da própria data de criação do registro (emissão = dtCriacao;
 * vencimento = emissão, à vista) antes de aplicar a restrição.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    -- ContasAPagar
    UPDATE "ContasAPagar" SET "dtEmissao" = "dtCriacao"::date WHERE "dtEmissao" IS NULL;
    UPDATE "ContasAPagar" SET "dtVencimento" = "dtEmissao" WHERE "dtVencimento" IS NULL;
    ALTER TABLE "ContasAPagar"
      ALTER COLUMN "dtEmissao"    SET NOT NULL,
      ALTER COLUMN "dtVencimento" SET NOT NULL;

    -- ContasAReceber
    UPDATE "ContasAReceber" SET "dtEmissao" = "dtCriacao"::date WHERE "dtEmissao" IS NULL;
    UPDATE "ContasAReceber" SET "dtVencimento" = "dtEmissao" WHERE "dtVencimento" IS NULL;
    ALTER TABLE "ContasAReceber"
      ALTER COLUMN "dtEmissao"    SET NOT NULL,
      ALTER COLUMN "dtVencimento" SET NOT NULL;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAPagar"
      ALTER COLUMN "dtEmissao"    DROP NOT NULL,
      ALTER COLUMN "dtVencimento" DROP NOT NULL;

    ALTER TABLE "ContasAReceber"
      ALTER COLUMN "dtEmissao"    DROP NOT NULL,
      ALTER COLUMN "dtVencimento" DROP NOT NULL;
  ` );
};
