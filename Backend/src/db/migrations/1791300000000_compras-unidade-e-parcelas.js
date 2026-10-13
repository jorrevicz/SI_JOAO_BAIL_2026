/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Compras — RN020 (unidade por item) e RN022/RN023 (parcelas da compra):
 *
 * "CompraProduto"."unidade" (RN020): unidade em que o fornecedor vendeu o produto naquela
 * compra; pode diferir de "Produtos"."undProduto" e nunca é gravada de volta no cadastro.
 * Backfill: os itens já existentes recebem a unidade atual do produto.
 *
 * "CompraParcelas" (RN023): parcelas próprias da compra, geradas a partir da condição de
 * pagamento (RN022) mas ajustáveis só ali — nunca alteram "CondicaoDePagamento" nem
 * "Parcelas". Mesmo padrão de "CompraProduto": filha embutida da compra, sem `isActive`
 * (remoção física na reconciliação), chave composta pela chave natural da compra mais o
 * número da parcela. Lançar a compra continua sem gerar Contas a Pagar.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) =>
{
    pgm.sql ( `
        ALTER TABLE "CompraProduto" ADD COLUMN "unidade" VARCHAR(4);

        UPDATE "CompraProduto" item
        SET    "unidade" = produto."undProduto"
        FROM   "Produtos" produto
        WHERE  produto."codProd" = item."codProduto";

        ALTER TABLE "CompraProduto" ALTER COLUMN "unidade" SET NOT NULL;

        CREATE TABLE "CompraParcelas"
        (
            "numero"        VARCHAR(9)    NOT NULL,
            "modelo"        VARCHAR(2)    NOT NULL,
            "serie"         VARCHAR(2)    NOT NULL,
            "codForn"       INTEGER       NOT NULL,
            "numParcela"    INTEGER       NOT NULL,
            "codFormaDePag" INTEGER       NOT NULL,
            "valor"         DECIMAL(10,2) NOT NULL,
            "dtVencimento"  TIMESTAMPTZ(3) NOT NULL,
            "dtCriacao"     TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "dtEdicao"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "codUser"       INTEGER,
            CONSTRAINT "CompraParcelas_pkey"
                PRIMARY KEY ( "numero", "modelo", "serie", "codForn", "numParcela" ),
            CONSTRAINT "CompraParcelas_compra_fkey"
                FOREIGN KEY ( "numero", "modelo", "serie", "codForn" )
                REFERENCES "Compras" ( "numero", "modelo", "serie", "codForn" )
                ON UPDATE CASCADE ON DELETE RESTRICT,
            CONSTRAINT "CompraParcelas_codFormaDePag_fkey"
                FOREIGN KEY ( "codFormaDePag" )
                REFERENCES "FormaDePagamento" ( "codFormaDePag" )
                ON UPDATE CASCADE ON DELETE RESTRICT,
            CONSTRAINT "CompraParcelas_numParcela_check" CHECK ( "numParcela" > 0 ),
            CONSTRAINT "CompraParcelas_valor_check" CHECK ( "valor" > 0 )
        );

        CREATE INDEX "CompraParcelas_codFormaDePag_idx" ON "CompraParcelas" ( "codFormaDePag" );
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) =>
{
    pgm.sql ( `
        DROP TABLE "CompraParcelas";
        ALTER TABLE "CompraProduto" DROP COLUMN "unidade";
    ` );
};
