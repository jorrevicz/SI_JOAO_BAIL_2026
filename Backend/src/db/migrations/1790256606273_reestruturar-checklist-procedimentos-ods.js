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
        ALTER TABLE "ProcedimentosOdS"
            ADD COLUMN "ordem" INTEGER;

        WITH "Numerada" AS
        (
            SELECT "numOdS", "codProcedimento",
                ROW_NUMBER() OVER ( PARTITION BY "numOdS" ORDER BY "codProcedimento" ) AS "ordemCalculada"
            FROM "ProcedimentosOdS"
        )
        UPDATE "ProcedimentosOdS" AS "Alvo"
        SET "ordem" = "Numerada"."ordemCalculada"
        FROM "Numerada"
        WHERE "Alvo"."numOdS" = "Numerada"."numOdS"
        AND "Alvo"."codProcedimento" = "Numerada"."codProcedimento";

        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "ordem" SET NOT NULL;

        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "posicao" DROP NOT NULL;

        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "dthFim" DROP NOT NULL,
            ALTER COLUMN "dthFim" DROP DEFAULT;

        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "checagem" DROP NOT NULL,
            ALTER COLUMN "checagem" DROP DEFAULT,
            ALTER COLUMN "checagem" TYPE BOOLEAN USING
            (
                CASE
                    WHEN "checagem" ILIKE 'SIM' THEN true
                    WHEN "checagem" ILIKE 'NAO' OR "checagem" ILIKE 'NÃO' THEN false
                    ELSE NULL
                END
            );
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "checagem" TYPE VARCHAR(8) USING
            (
                CASE
                    WHEN "checagem" = true  THEN 'SIM'
                    WHEN "checagem" = false THEN 'NAO'
                    ELSE NULL
                END
            );
        UPDATE "ProcedimentosOdS" SET "checagem" = 'NAO' WHERE "checagem" IS NULL;
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "checagem" SET DEFAULT '',
            ALTER COLUMN "checagem" SET NOT NULL,
            ALTER COLUMN "checagem" DROP DEFAULT;

        UPDATE "ProcedimentosOdS" SET "dthFim" = CURRENT_TIMESTAMP WHERE "dthFim" IS NULL;
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "dthFim" SET DEFAULT CURRENT_TIMESTAMP,
            ALTER COLUMN "dthFim" SET NOT NULL;

        UPDATE "ProcedimentosOdS" SET "posicao" = '' WHERE "posicao" IS NULL;
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "posicao" SET NOT NULL;

        ALTER TABLE "ProcedimentosOdS"
            DROP COLUMN "ordem";
    ` );
};
