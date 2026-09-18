/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * "Compras": adiciona campos numéricos de custo da operação (`frete`, `seguro`,
 * `despesas`) e a justificativa de cancelamento (`justificativaCancelamento`),
 * preenchida pela operação `cancelarCompra()` já prevista no domínio.
 *
 * "ContasAPagar" / "ContasAReceber": unifica a nomenclatura de vencimento e valor
 * (`vencFatura`/`vencRecibo` → `dtVencimento`, `vlrFatura`/`vlrRecibo` → `valor`),
 * adiciona os encargos do título (`juro`, `desconto`, `multa`) e o registro de
 * baixa (`valorBaixa`, `dtBaixa`) — este último espelhado nas duas entidades,
 * já que "baixar" um título vale tanto para pagar quanto para receber. `ContasAPagar`
 * também ganha `dtEmissao`, que já existia em `ContasAReceber`. `dtBaixa` e a já
 * existente `dtPagamento` (ContasAReceber) permanecem anuláveis — só são
 * preenchidas quando o título é efetivamente pago/baixado, nunca no cadastro.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    -- "Compras": campos numéricos de custo da operação e justificativa de cancelamento
    ALTER TABLE "Compras"
      ADD COLUMN "frete"                    DECIMAL(10,2) NOT NULL,
      ADD COLUMN "seguro"                   DECIMAL(10,2) NOT NULL,
      ADD COLUMN "despesas"                 DECIMAL(10,2) NOT NULL,
      ADD COLUMN "justificativaCancelamento" VARCHAR(255);

    -- "ContasAPagar": unifica nomenclatura de vencimento e valor
    ALTER TABLE "ContasAPagar"
      RENAME COLUMN "vencFatura" TO "dtVencimento";
    ALTER TABLE "ContasAPagar"
      RENAME COLUMN "vlrFatura" TO "valor";

    -- "ContasAPagar": data de emissão (já existente em "ContasAReceber"), encargos,
    -- baixa e justificativa de cancelamento
    ALTER TABLE "ContasAPagar"
      ADD COLUMN "dtEmissao"                 TIMESTAMP(3),
      ADD COLUMN "juro"                      DECIMAL(10,2) NOT NULL,
      ADD COLUMN "desconto"                  DECIMAL(10,2) NOT NULL,
      ADD COLUMN "multa"                     DECIMAL(10,2) NOT NULL,
      ADD COLUMN "valorBaixa"                DECIMAL(10,2),
      ADD COLUMN "dtBaixa"                   TIMESTAMP(3),
      ADD COLUMN "justificativaCancelamento" VARCHAR(255);

    -- "ContasAReceber": unifica nomenclatura de vencimento e valor
    ALTER TABLE "ContasAReceber"
      RENAME COLUMN "vencRecibo" TO "dtVencimento";
    ALTER TABLE "ContasAReceber"
      RENAME COLUMN "vlrRecibo" TO "valor";

    -- "ContasAReceber": encargos, baixa e justificativa de cancelamento
    ALTER TABLE "ContasAReceber"
      ADD COLUMN "juro"                      DECIMAL(10,2) NOT NULL,
      ADD COLUMN "desconto"                  DECIMAL(10,2) NOT NULL,
      ADD COLUMN "multa"                     DECIMAL(10,2) NOT NULL,
      ADD COLUMN "valorBaixa"                DECIMAL(10,2),
      ADD COLUMN "dtBaixa"                   TIMESTAMP(3),
      ADD COLUMN "justificativaCancelamento" VARCHAR(255);
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    -- "ContasAReceber": desfaz encargos, baixa e justificativa de cancelamento
    ALTER TABLE "ContasAReceber"
      DROP COLUMN "justificativaCancelamento",
      DROP COLUMN "dtBaixa",
      DROP COLUMN "valorBaixa",
      DROP COLUMN "multa",
      DROP COLUMN "desconto",
      DROP COLUMN "juro";

    -- "ContasAReceber": restaura nomenclatura original de vencimento e valor
    ALTER TABLE "ContasAReceber"
      RENAME COLUMN "valor" TO "vlrRecibo";
    ALTER TABLE "ContasAReceber"
      RENAME COLUMN "dtVencimento" TO "vencRecibo";

    -- "ContasAPagar": desfaz emissão, encargos, baixa e justificativa de cancelamento
    ALTER TABLE "ContasAPagar"
      DROP COLUMN "justificativaCancelamento",
      DROP COLUMN "dtBaixa",
      DROP COLUMN "valorBaixa",
      DROP COLUMN "multa",
      DROP COLUMN "desconto",
      DROP COLUMN "juro",
      DROP COLUMN "dtEmissao";

    -- "ContasAPagar": restaura nomenclatura original de vencimento e valor
    ALTER TABLE "ContasAPagar"
      RENAME COLUMN "valor" TO "vlrFatura";
    ALTER TABLE "ContasAPagar"
      RENAME COLUMN "dtVencimento" TO "vencFatura";

    -- "Compras": desfaz campos numéricos de custo da operação e justificativa de cancelamento
    ALTER TABLE "Compras"
      DROP COLUMN "justificativaCancelamento",
      DROP COLUMN "despesas",
      DROP COLUMN "seguro",
      DROP COLUMN "frete";
  ` );
};
