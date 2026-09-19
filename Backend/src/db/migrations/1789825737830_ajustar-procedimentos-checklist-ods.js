/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "OrdemDeServicos"
            DROP CONSTRAINT "OrdemDeServicos_codProcedimento_fkey";
        ALTER TABLE "OrdemDeServicos"
            DROP COLUMN "codProcedimento";

        ALTER TABLE "Procedimentos"
            DROP COLUMN "dthFim",
            DROP COLUMN "posicao",
            DROP COLUMN "checagem",
            DROP COLUMN "obsProcedimento";

        CREATE TABLE "ProcedimentosOdS"
        (
            "numOdS" CHAR(8) NOT NULL,
            "codProcedimento" INTEGER NOT NULL,
            "posicao" VARCHAR(8) NOT NULL,
            "checagem" VARCHAR(8) NOT NULL,
            "obsProcedimento" VARCHAR(244),
            "dthFim" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "dtCriacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "dtEdicao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "codUser" INTEGER,
            "isActive" BOOL NOT NULL DEFAULT true,
            CONSTRAINT "ProcedimentosOdS_pkey" PRIMARY KEY ( "numOdS", "codProcedimento" )
        );
        ALTER TABLE "ProcedimentosOdS"
            ADD CONSTRAINT "ProcedimentosOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "ProcedimentosOdS"
            ADD CONSTRAINT "ProcedimentosOdS_codProcedimento_fkey" FOREIGN KEY ( "codProcedimento" ) REFERENCES "Procedimentos" ( "codProcedimento" ) ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        DROP TABLE IF EXISTS "ProcedimentosOdS";

        ALTER TABLE "Procedimentos"
            ADD COLUMN "dthFim" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN "posicao" VARCHAR(8) NOT NULL DEFAULT '',
            ADD COLUMN "checagem" VARCHAR(8) NOT NULL DEFAULT '',
            ADD COLUMN "obsProcedimento" VARCHAR(244);
        ALTER TABLE "Procedimentos"
            ALTER COLUMN "posicao" DROP DEFAULT,
            ALTER COLUMN "checagem" DROP DEFAULT;

        ALTER TABLE "OrdemDeServicos"
            ADD COLUMN "codProcedimento" INTEGER;
        ALTER TABLE "OrdemDeServicos"
            ADD CONSTRAINT "OrdemDeServicos_codProcedimento_fkey" FOREIGN KEY ( "codProcedimento" ) REFERENCES "Procedimentos" ( "codProcedimento" ) ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};
