/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Lote C-5 — NF-e de entrada gerada a partir da compra (T-083/T-090–T-092).
 *
 * - `NotasFiscaisEletronicas` passa a referenciar a compra pela chave natural
 *   (`numero`, `modelo`, `serie`, `codFornecedor`) → `Compras`; só uma NF-e ativa por compra
 *   (índice único parcial em `isActive`, para permitir gerar outra depois de cancelar).
 * - 3FN: saem do cabeçalho os campos de item (já vivem em `ProdutoNfe`), o `codVeiculo`
 *   (vive em `VeiculoNfe`), a transportadora e os documentos do emitente (vêm da compra e do
 *   fornecedor) e `modelo`/`numSerie` (substituídos pela chave da compra).
 * - `ProdutoNfe` perde os valores calculados (base, ICMS e IPI em R$ — o Backend os calcula a
 *   cada leitura) e os campos informados passam a obrigatórios.
 *
 * As tabelas fiscais ainda não tinham módulo que as gravasse (só dado local) — são truncadas.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        TRUNCATE "VeiculoNfe", "ProdutoNfe", "NotasFiscaisEletronicas";

        ALTER TABLE "NotasFiscaisEletronicas"
            DROP CONSTRAINT "NotasFiscaisEletronicas_codProduto_fkey",
            DROP CONSTRAINT "NotasFiscaisEletronicas_codTransportadora_fkey",
            DROP COLUMN "codProduto",
            DROP COLUMN "codTransportadora",
            DROP COLUMN "codVeiculo",
            DROP COLUMN "modelo",
            DROP COLUMN "numSerie",
            DROP COLUMN "inscEstadualNfe",
            DROP COLUMN "cpfCnpjNfe",
            DROP COLUMN "csosnProdNfe",
            DROP COLUMN "cfopNfe",
            DROP COLUMN "qtdProdNfe",
            DROP COLUMN "vlrUnProdNfe",
            DROP COLUMN "vlrDescProdNfe",
            DROP COLUMN "vlrProdNfe",
            DROP COLUMN "vlrIpiProdNfe",
            DROP COLUMN "aliqIcmsProdNfe",
            DROP COLUMN "aliqIpiProdNfe",
            DROP COLUMN "baseIcmsProdNfe",
            DROP COLUMN "calcIcmsSubs",
            DROP COLUMN "vlrIcmsSubs",
            ADD COLUMN "numero"                    VARCHAR(9)   NOT NULL,
            ADD COLUMN "modelo"                    VARCHAR(2)   NOT NULL,
            ADD COLUMN "serie"                     VARCHAR(2)   NOT NULL,
            ADD COLUMN "justificativaCancelamento" VARCHAR(255),
            ALTER COLUMN "codFornecedor"  SET NOT NULL,
            ALTER COLUMN "chaveAcessoNfe" SET NOT NULL,
            ALTER COLUMN "naturezaOp"     SET NOT NULL,
            ALTER COLUMN "dhEmiNfe"       SET NOT NULL,
            ALTER COLUMN "fretePorConta"  SET NOT NULL,
            ADD CONSTRAINT "NotasFiscaisEletronicas_compra_fkey"
                FOREIGN KEY ( "numero", "modelo", "serie", "codFornecedor" )
                REFERENCES "Compras" ( "numero", "modelo", "serie", "codForn" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        DROP INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key";

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key"
            ON "NotasFiscaisEletronicas" ( "chaveAcessoNfe" )
            WHERE "isActive";

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_compra_ativa_key"
            ON "NotasFiscaisEletronicas" ( "numero", "modelo", "serie", "codFornecedor" )
            WHERE "isActive";

        ALTER TABLE "ProdutoNfe"
            DROP COLUMN "prodBcIcms",
            DROP COLUMN "prodVlrIcmsNfe",
            DROP COLUMN "prodVlrIpiNfe",
            ALTER COLUMN "prodCfopNfe"     TYPE VARCHAR(4),
            ALTER COLUMN "prodCfopNfe"     SET NOT NULL,
            ALTER COLUMN "prodCsosnNfe"    SET NOT NULL,
            ALTER COLUMN "prodVlrUnNfe"    SET NOT NULL,
            ALTER COLUMN "prodQtdNfe"      SET NOT NULL,
            ALTER COLUMN "prodVlrDescNfe"  SET NOT NULL,
            ALTER COLUMN "prodAliqIcmsNfe" SET NOT NULL,
            ALTER COLUMN "prodAliqIpiNfe"  SET NOT NULL;
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        TRUNCATE "VeiculoNfe", "ProdutoNfe", "NotasFiscaisEletronicas";

        ALTER TABLE "ProdutoNfe"
            ALTER COLUMN "prodAliqIpiNfe"  DROP NOT NULL,
            ALTER COLUMN "prodAliqIcmsNfe" DROP NOT NULL,
            ALTER COLUMN "prodVlrDescNfe"  DROP NOT NULL,
            ALTER COLUMN "prodQtdNfe"      DROP NOT NULL,
            ALTER COLUMN "prodVlrUnNfe"    DROP NOT NULL,
            ALTER COLUMN "prodCsosnNfe"    DROP NOT NULL,
            ALTER COLUMN "prodCfopNfe"     DROP NOT NULL,
            ALTER COLUMN "prodCfopNfe"     TYPE VARCHAR(10),
            ADD COLUMN "prodBcIcms"     DECIMAL(10,2),
            ADD COLUMN "prodVlrIcmsNfe" DECIMAL(10,2),
            ADD COLUMN "prodVlrIpiNfe"  DECIMAL(10,2);

        DROP INDEX "NotasFiscaisEletronicas_compra_ativa_key";
        DROP INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key";

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key"
            ON "NotasFiscaisEletronicas" ( "chaveAcessoNfe" );

        ALTER TABLE "NotasFiscaisEletronicas"
            DROP CONSTRAINT "NotasFiscaisEletronicas_compra_fkey",
            ALTER COLUMN "fretePorConta"  DROP NOT NULL,
            ALTER COLUMN "dhEmiNfe"       DROP NOT NULL,
            ALTER COLUMN "naturezaOp"     DROP NOT NULL,
            ALTER COLUMN "chaveAcessoNfe" DROP NOT NULL,
            ALTER COLUMN "codFornecedor"  DROP NOT NULL,
            DROP COLUMN "justificativaCancelamento",
            DROP COLUMN "serie",
            DROP COLUMN "modelo",
            DROP COLUMN "numero",
            ADD COLUMN "codTransportadora" INTEGER,
            ADD COLUMN "codProduto"        INTEGER,
            ADD COLUMN "codVeiculo"        INTEGER,
            ADD COLUMN "modelo"            VARCHAR(9),
            ADD COLUMN "numSerie"          VARCHAR(3),
            ADD COLUMN "inscEstadualNfe"   VARCHAR(10),
            ADD COLUMN "cpfCnpjNfe"        VARCHAR(14),
            ADD COLUMN "csosnProdNfe"      VARCHAR(10),
            ADD COLUMN "cfopNfe"           VARCHAR(10),
            ADD COLUMN "qtdProdNfe"        DECIMAL(10,3),
            ADD COLUMN "vlrUnProdNfe"      DECIMAL(10,2),
            ADD COLUMN "vlrDescProdNfe"    DECIMAL(10,2),
            ADD COLUMN "vlrProdNfe"        DECIMAL(10,2),
            ADD COLUMN "vlrIpiProdNfe"     DECIMAL(10,2),
            ADD COLUMN "aliqIcmsProdNfe"   DECIMAL(5,2),
            ADD COLUMN "aliqIpiProdNfe"    DECIMAL(5,2),
            ADD COLUMN "baseIcmsProdNfe"   DECIMAL(10,2),
            ADD COLUMN "calcIcmsSubs"      DECIMAL(10,2),
            ADD COLUMN "vlrIcmsSubs"       DECIMAL(10,2),
            ADD CONSTRAINT "NotasFiscaisEletronicas_codTransportadora_fkey"
                FOREIGN KEY ( "codTransportadora" ) REFERENCES "Transportadoras" ( "codTransp" )
                ON DELETE RESTRICT ON UPDATE CASCADE,
            ADD CONSTRAINT "NotasFiscaisEletronicas_codProduto_fkey"
                FOREIGN KEY ( "codProduto" ) REFERENCES "Produtos" ( "codProd" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        CREATE INDEX "NotasFiscaisEletronicas_codTransportadora_idx"
            ON "NotasFiscaisEletronicas" ( "codTransportadora" );
        CREATE INDEX "NotasFiscaisEletronicas_codProduto_idx"
            ON "NotasFiscaisEletronicas" ( "codProduto" );
    ` );
};
