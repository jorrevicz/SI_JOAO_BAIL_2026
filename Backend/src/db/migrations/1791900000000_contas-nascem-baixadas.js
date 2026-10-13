/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Contas a Pagar e a Receber deixam de ter o estado derivado "em aberto": a conta nasce
 * já baixada, sem edição, exclusão nem baixa posterior — só pode ser cancelada. Por isso
 * `valorBaixa`/`dtBaixa` (e `dtPagamento`, em Contas a Receber) passam a obrigatórias.
 *
 * Backfill das contas pré-existentes ainda não baixadas (só dado local de seed/teste):
 * `valorBaixa` = valor + juro + multa − desconto, e as datas = vencimento.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        UPDATE "ContasAPagar"
        SET "valorBaixa" = COALESCE ( "valor", 0 ) + COALESCE ( "juro", 0 ) + COALESCE ( "multa", 0 ) - COALESCE ( "desconto", 0 ),
            "dtBaixa"    = "dtVencimento"
        WHERE "valorBaixa" IS NULL OR "dtBaixa" IS NULL;

        UPDATE "ContasAReceber"
        SET "valorBaixa"  = COALESCE ( "valor", 0 ) + COALESCE ( "juro", 0 ) + COALESCE ( "multa", 0 ) - COALESCE ( "desconto", 0 ),
            "dtBaixa"     = COALESCE ( "dtBaixa", "dtVencimento" ),
            "dtPagamento" = COALESCE ( "dtPagamento", "dtVencimento" )
        WHERE "valorBaixa" IS NULL OR "dtBaixa" IS NULL OR "dtPagamento" IS NULL;

        ALTER TABLE "ContasAPagar"
            ALTER COLUMN "valorBaixa" SET NOT NULL,
            ALTER COLUMN "dtBaixa"    SET NOT NULL;

        ALTER TABLE "ContasAReceber"
            ALTER COLUMN "valorBaixa"  SET NOT NULL,
            ALTER COLUMN "dtBaixa"     SET NOT NULL,
            ALTER COLUMN "dtPagamento" SET NOT NULL;
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "ContasAReceber"
            ALTER COLUMN "dtPagamento" DROP NOT NULL,
            ALTER COLUMN "dtBaixa"     DROP NOT NULL,
            ALTER COLUMN "valorBaixa"  DROP NOT NULL;

        ALTER TABLE "ContasAPagar"
            ALTER COLUMN "dtBaixa"    DROP NOT NULL,
            ALTER COLUMN "valorBaixa" DROP NOT NULL;
    ` );
};
