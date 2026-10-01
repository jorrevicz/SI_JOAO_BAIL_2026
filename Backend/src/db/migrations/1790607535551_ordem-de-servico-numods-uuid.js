/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * numOdS deixa de ser uma chave natural informada pelo requisitante (CHAR(8), sem
 * validação de formato além do comprimento) e passa a ser um UID gerado pelo banco
 * (UUID, DEFAULT gen_random_uuid()) — decisão do responsável pelo projeto. As tabelas
 * dependentes só existem com dados de seed/teste em ambiente local, por isso são
 * truncadas (não há dado de produção a preservar).
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "SubstituirPecasOdS"
            DROP CONSTRAINT "SubstituirPecasOdS_numOdS_fkey";
        ALTER TABLE "OrcamentoPecasOdS"
            DROP CONSTRAINT "OrcamentoPecasOdS_numOdS_fkey";
        ALTER TABLE "ServicosOdS"
            DROP CONSTRAINT "ServicosOdS_numOdS_fkey";
        ALTER TABLE "ProcedimentosOdS"
            DROP CONSTRAINT "ProcedimentosOdS_numOdS_fkey";

        TRUNCATE TABLE
            "SubstituirPecasOdS",
            "OrcamentoPecasOdS",
            "ServicosOdS",
            "ProcedimentosOdS",
            "OrdemDeServicos";

        ALTER TABLE "OrdemDeServicos"
            ALTER COLUMN "numOdS" TYPE UUID USING "numOdS"::uuid,
            ALTER COLUMN "numOdS" SET DEFAULT gen_random_uuid();

        ALTER TABLE "ServicosOdS"
            ALTER COLUMN "numOdS" TYPE UUID USING "numOdS"::uuid;
        ALTER TABLE "OrcamentoPecasOdS"
            ALTER COLUMN "numOdS" TYPE UUID USING "numOdS"::uuid;
        ALTER TABLE "SubstituirPecasOdS"
            ALTER COLUMN "numOdS" TYPE UUID USING "numOdS"::uuid;
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "numOdS" TYPE UUID USING "numOdS"::uuid;

        ALTER TABLE "ServicosOdS"
            ADD CONSTRAINT "ServicosOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "OrcamentoPecasOdS"
            ADD CONSTRAINT "OrcamentoPecasOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "SubstituirPecasOdS"
            ADD CONSTRAINT "SubstituirPecasOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "ProcedimentosOdS"
            ADD CONSTRAINT "ProcedimentosOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "SubstituirPecasOdS"
            DROP CONSTRAINT "SubstituirPecasOdS_numOdS_fkey";
        ALTER TABLE "OrcamentoPecasOdS"
            DROP CONSTRAINT "OrcamentoPecasOdS_numOdS_fkey";
        ALTER TABLE "ServicosOdS"
            DROP CONSTRAINT "ServicosOdS_numOdS_fkey";
        ALTER TABLE "ProcedimentosOdS"
            DROP CONSTRAINT "ProcedimentosOdS_numOdS_fkey";

        TRUNCATE TABLE
            "SubstituirPecasOdS",
            "OrcamentoPecasOdS",
            "ServicosOdS",
            "ProcedimentosOdS",
            "OrdemDeServicos";

        ALTER TABLE "OrdemDeServicos"
            ALTER COLUMN "numOdS" DROP DEFAULT,
            ALTER COLUMN "numOdS" TYPE CHAR(8) USING NULL;

        ALTER TABLE "ServicosOdS"
            ALTER COLUMN "numOdS" TYPE CHAR(8) USING NULL;
        ALTER TABLE "OrcamentoPecasOdS"
            ALTER COLUMN "numOdS" TYPE CHAR(8) USING NULL;
        ALTER TABLE "SubstituirPecasOdS"
            ALTER COLUMN "numOdS" TYPE CHAR(8) USING NULL;
        ALTER TABLE "ProcedimentosOdS"
            ALTER COLUMN "numOdS" TYPE CHAR(8) USING NULL;

        ALTER TABLE "ServicosOdS"
            ADD CONSTRAINT "ServicosOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "OrcamentoPecasOdS"
            ADD CONSTRAINT "OrcamentoPecasOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "SubstituirPecasOdS"
            ADD CONSTRAINT "SubstituirPecasOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
        ALTER TABLE "ProcedimentosOdS"
            ADD CONSTRAINT "ProcedimentosOdS_numOdS_fkey" FOREIGN KEY ( "numOdS" ) REFERENCES "OrdemDeServicos" ( "numOdS" ) ON DELETE RESTRICT ON UPDATE CASCADE;
    ` );
};
