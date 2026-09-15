/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * "Compras": adiciona as datas de chegada, emissão e operação de entrada da
 * mercadoria; remove o vínculo formal com a nota fiscal (deixa de referenciar
 * "NotasFiscaisEletronicas"); e torna obrigatória a condição de pagamento.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    -- "Compras": datas de chegada, emissão e operação de entrada da mercadoria
    ALTER TABLE "Compras"
      ADD COLUMN "dtChegada" TIMESTAMP(3),
      ADD COLUMN "dtEmissao" TIMESTAMP(3),
      ADD COLUMN "dtEntrada" TIMESTAMP(3);

    -- "Compras": solta o vínculo formal com a nota fiscal (compra deixa de referenciar NF-e)
    ALTER TABLE "Compras"
      DROP CONSTRAINT "Compras_codNfe_fkey",
      DROP COLUMN "codNfe";

    -- "Compras": condição de pagamento passa a ser obrigatória
    ALTER TABLE "Compras"
      ALTER COLUMN "codCondDePag" SET NOT NULL;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    -- "Compras": condição de pagamento volta a ser opcional
    ALTER TABLE "Compras"
      ALTER COLUMN "codCondDePag" DROP NOT NULL;

    -- "Compras": restaura a coluna e a FK de nota fiscal
    ALTER TABLE "Compras"
      ADD COLUMN "codNfe" INTEGER;
    CREATE INDEX "Compras_codNfe_idx" ON "Compras" ( "codNfe" );
    ALTER TABLE "Compras"
      ADD CONSTRAINT "Compras_codNfe_fkey"
      FOREIGN KEY ( "codNfe" ) REFERENCES "NotasFiscaisEletronicas" ( "codNfe" )
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- "Compras": remove as datas de chegada, emissão e operação de entrada
    ALTER TABLE "Compras"
      DROP COLUMN "dtChegada",
      DROP COLUMN "dtEmissao",
      DROP COLUMN "dtEntrada";
  ` );
};
