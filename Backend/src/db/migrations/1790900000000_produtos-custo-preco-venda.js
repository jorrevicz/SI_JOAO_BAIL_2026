/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Fase 4 (Lote C-0) — correção da tabela "Produtos":
 *
 * - `custoProd`: o "Custo inicial" informado no cadastro passa a ter coluna própria
 *   (custo unitário de referência / da última compra). Antes ele era gravado em
 *   `custoMedioProd`, e a listagem o exibia como custo médio sem que nenhuma compra
 *   tivesse acontecido. Os registros existentes herdam o valor que estava em
 *   `custoMedioProd`, que é zerado — o custo médio ponderado passa a ser calculado
 *   somente pelas compras lançadas.
 * - `precoVenda`: preço de venda do produto, informado e editável no cadastro
 *   (exibido no rodapé da compra — RN015). Os registros existentes recebem o próprio
 *   custo como valor provisório.
 * - `saldoProd`: removida — duplicava `estoque` (3FN); o "saldo" passa a ser o estoque.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Produtos"
            ADD COLUMN "custoProd"  DECIMAL(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN "precoVenda" DECIMAL(10,2);

        UPDATE "Produtos"
        SET    "custoProd"      = "custoMedioProd",
               "precoVenda"     = "custoMedioProd",
               "custoMedioProd" = 0;

        ALTER TABLE "Produtos"
            ALTER COLUMN "precoVenda" SET NOT NULL,
            DROP COLUMN "saldoProd";
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Produtos"
            ADD COLUMN "saldoProd" DECIMAL(10,3) NOT NULL DEFAULT 0;

        UPDATE "Produtos"
        SET    "saldoProd"      = "estoque",
               "custoMedioProd" = CASE WHEN "custoMedioProd" > 0 THEN "custoMedioProd" ELSE "custoProd" END;

        ALTER TABLE "Produtos"
            DROP COLUMN "precoVenda",
            DROP COLUMN "custoProd";
    ` );
};
