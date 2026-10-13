/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * A compra deixa de ter o estado 'aberto' (rascunho): ela passa a nascer já lançada, com a
 * entrada no estoque e no custo médio feita na mesma transação do cadastro. Sem rascunho
 * nem edição, `situacao` ficaria sempre 'lançado' — coluna redundante, então é removida
 * (3FN); o cancelamento continua derivado de `justificativaCancelamento`.
 *
 * - Rascunhos pré-existentes ('aberto') nunca movimentaram estoque e já não podem ser
 *   editados nem lançados: são apagados junto com itens e parcelas (só dado local de
 *   seed/teste, nada de produção a preservar).
 * - `dtEntrada` (data da operação — RN018) passa a obrigatória, pois toda compra restante
 *   foi lançada.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        DELETE FROM "CompraParcelas" parcela
        USING "Compras" compra
        WHERE parcela."numero"  = compra."numero"
        AND   parcela."modelo"  = compra."modelo"
        AND   parcela."serie"   = compra."serie"
        AND   parcela."codForn" = compra."codForn"
        AND   compra."situacao" = 'aberto';

        DELETE FROM "CompraProduto" item
        USING "Compras" compra
        WHERE item."numero"  = compra."numero"
        AND   item."modelo"  = compra."modelo"
        AND   item."serie"   = compra."serie"
        AND   item."codForn" = compra."codForn"
        AND   compra."situacao" = 'aberto';

        DELETE FROM "Compras" WHERE "situacao" = 'aberto';

        ALTER TABLE "Compras"
            DROP COLUMN "situacao",
            ALTER COLUMN "dtEntrada" SET NOT NULL;
    ` );
};

/**
 * Recria `situacao` (toda compra existente volta como 'lançado') e torna `dtEntrada`
 * anulável de novo. Os rascunhos apagados não voltam.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "Compras"
            ALTER COLUMN "dtEntrada" DROP NOT NULL,
            ADD COLUMN "situacao" VARCHAR(8) NOT NULL DEFAULT 'aberto';

        UPDATE "Compras" SET "situacao" = 'lançado';
    ` );
};
