/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Fase 4 (Lote C-1) — schema de Compras pronto para as regras RN009–RN018:
 *
 * "Compras":
 * - `situacao`: estados da compra, apenas 'aberto' (rascunho editável, sem efeito em
 *   estoque/custo) e 'lançado' (entrada efetivada) — RN013; domínio fechado validado
 *   no Zod (mesmo padrão de "OrdemDeServicos"."situacao"). Cancelamento é derivado de
 *   `justificativaCancelamento`, como em Contas a Pagar/Receber (sem estado "pendente").
 * - `vlrTotal`: INTEGER → DECIMAL(10,2) (valor monetário com centavos).
 * - `dtEmissao`/`dtChegada` passam a obrigatórias (RN004); `dtEntrada` continua anulável
 *   — é preenchida no lançamento (data da operação, RN018).
 *
 * "CompraProduto":
 * - `quantidade`, `valorUnitario` e `desconto` (desconto só por item — RN016).
 * - `percentualRateio`/`valorRateio`: rateio de frete/seguro/despesas por item (RN011).
 * - `custoMedioProduto` (custo unitário final do item, histórico) passa a obrigatório.
 *
 * As duas tabelas ainda não têm linhas (o módulo de Compras nasce nesta fase), então
 * não há backfill de dados.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            ADD COLUMN "situacao" VARCHAR(8) NOT NULL DEFAULT 'aberto',
            ALTER COLUMN "vlrTotal"  TYPE DECIMAL(10,2),
            ALTER COLUMN "dtEmissao" SET NOT NULL,
            ALTER COLUMN "dtChegada" SET NOT NULL;

        ALTER TABLE "CompraProduto"
            ADD COLUMN "quantidade"       INTEGER       NOT NULL,
            ADD COLUMN "valorUnitario"    DECIMAL(10,2) NOT NULL,
            ADD COLUMN "desconto"         DECIMAL(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN "percentualRateio" DECIMAL(5,2)  NOT NULL DEFAULT 0,
            ADD COLUMN "valorRateio"      DECIMAL(10,2) NOT NULL DEFAULT 0,
            ALTER COLUMN "custoMedioProduto" SET NOT NULL,
            ADD CONSTRAINT "CompraProduto_quantidade_check" CHECK ( "quantidade" > 0 );
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "CompraProduto"
            DROP CONSTRAINT "CompraProduto_quantidade_check",
            ALTER COLUMN "custoMedioProduto" DROP NOT NULL,
            DROP COLUMN "valorRateio",
            DROP COLUMN "percentualRateio",
            DROP COLUMN "desconto",
            DROP COLUMN "valorUnitario",
            DROP COLUMN "quantidade";

        ALTER TABLE "Compras"
            ALTER COLUMN "dtChegada" DROP NOT NULL,
            ALTER COLUMN "dtEmissao" DROP NOT NULL,
            ALTER COLUMN "vlrTotal"  TYPE INTEGER USING ROUND ( "vlrTotal" )::INTEGER,
            DROP COLUMN "situacao";
    ` );
};
