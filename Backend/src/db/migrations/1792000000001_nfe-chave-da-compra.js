/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * A NF-e de entrada passa a ter **as mesmas chaves da compra** como chave primária:
 * (`modelo`, `numero`, `serie`, `codFornecedor`) — o documento da compra é a própria nota do
 * fornecedor. O código gerado `codNfe` é removido e os filhos herdam a chave composta:
 *
 * - `NotasFiscaisEletronicas`: PK = chave da compra (que segue sendo FK para `Compras`).
 *   Com isso há no máximo uma NF-e por compra, inclusive cancelada — os índices únicos
 *   parciais em `isActive` deixam de fazer sentido e a chave de acesso volta a ser única.
 * - `ProdutoNfe`: PK (`modelo`, `numero`, `serie`, `codFornecedor`, `codProduto`).
 * - `VeiculoNfe`: PK (`modelo`, `numero`, `serie`, `codFornecedor`, `codVeiculo`); a coluna
 *   `codForn` vira `codFornecedor` e passa a fazer parte da FK composta para a nota (a FK
 *   avulsa para `Fornecedores` fica redundante e sai).
 *
 * Só há dado local (seed/teste) nas tabelas fiscais — são truncadas; o seed as recria.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        TRUNCATE "VeiculoNfe", "ProdutoNfe", "NotasFiscaisEletronicas";

        -- Filhos: soltam a FK simples por codNfe
        ALTER TABLE "ProdutoNfe"
            DROP CONSTRAINT "ProdutoNfe_codNfe_fkey",
            DROP CONSTRAINT "ProdutoNfe_pkey",
            DROP COLUMN "codNfe";

        ALTER TABLE "VeiculoNfe"
            DROP CONSTRAINT "VeiculoNfe_codNfe_fkey",
            DROP CONSTRAINT "VeiculoNfe_codForn_fkey",
            DROP CONSTRAINT "VeiculoNfe_pkey",
            DROP COLUMN "codNfe";

        DROP INDEX "VeiculoNfe_codForn_idx";

        ALTER TABLE "VeiculoNfe" RENAME COLUMN "codForn" TO "codFornecedor";

        -- Nota: a chave da compra vira a chave primária
        DROP INDEX "NotasFiscaisEletronicas_compra_ativa_key";
        DROP INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key";

        ALTER TABLE "NotasFiscaisEletronicas"
            DROP CONSTRAINT "NotasFiscaisEletronicas_pkey",
            DROP COLUMN "codNfe",
            ADD CONSTRAINT "NotasFiscaisEletronicas_pkey"
                PRIMARY KEY ( "modelo", "numero", "serie", "codFornecedor" );

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key"
            ON "NotasFiscaisEletronicas" ( "chaveAcessoNfe" );

        -- Filhos: chave composta herdada da nota
        ALTER TABLE "ProdutoNfe"
            ADD COLUMN "modelo"        VARCHAR(2) NOT NULL,
            ADD COLUMN "numero"        VARCHAR(9) NOT NULL,
            ADD COLUMN "serie"         VARCHAR(2) NOT NULL,
            ADD COLUMN "codFornecedor" INTEGER    NOT NULL,
            ADD CONSTRAINT "ProdutoNfe_pkey"
                PRIMARY KEY ( "modelo", "numero", "serie", "codFornecedor", "codProduto" ),
            ADD CONSTRAINT "ProdutoNfe_nota_fkey"
                FOREIGN KEY ( "modelo", "numero", "serie", "codFornecedor" )
                REFERENCES "NotasFiscaisEletronicas" ( "modelo", "numero", "serie", "codFornecedor" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        ALTER TABLE "VeiculoNfe"
            ALTER COLUMN "codFornecedor" SET NOT NULL,
            ADD COLUMN "modelo" VARCHAR(2) NOT NULL,
            ADD COLUMN "numero" VARCHAR(9) NOT NULL,
            ADD COLUMN "serie"  VARCHAR(2) NOT NULL,
            ADD CONSTRAINT "VeiculoNfe_pkey"
                PRIMARY KEY ( "modelo", "numero", "serie", "codFornecedor", "codVeiculo" ),
            ADD CONSTRAINT "VeiculoNfe_nota_fkey"
                FOREIGN KEY ( "modelo", "numero", "serie", "codFornecedor" )
                REFERENCES "NotasFiscaisEletronicas" ( "modelo", "numero", "serie", "codFornecedor" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        CREATE INDEX "VeiculoNfe_codVeiculo_idx" ON "VeiculoNfe" ( "codVeiculo" );
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        TRUNCATE "VeiculoNfe", "ProdutoNfe", "NotasFiscaisEletronicas";

        DROP INDEX "VeiculoNfe_codVeiculo_idx";

        ALTER TABLE "VeiculoNfe"
            DROP CONSTRAINT "VeiculoNfe_nota_fkey",
            DROP CONSTRAINT "VeiculoNfe_pkey",
            DROP COLUMN "serie",
            DROP COLUMN "numero",
            DROP COLUMN "modelo",
            ALTER COLUMN "codFornecedor" DROP NOT NULL;

        ALTER TABLE "VeiculoNfe" RENAME COLUMN "codFornecedor" TO "codForn";

        ALTER TABLE "ProdutoNfe"
            DROP CONSTRAINT "ProdutoNfe_nota_fkey",
            DROP CONSTRAINT "ProdutoNfe_pkey",
            DROP COLUMN "codFornecedor",
            DROP COLUMN "serie",
            DROP COLUMN "numero",
            DROP COLUMN "modelo";

        DROP INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key";

        ALTER TABLE "NotasFiscaisEletronicas"
            DROP CONSTRAINT "NotasFiscaisEletronicas_pkey",
            ADD COLUMN "codNfe" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY,
            ADD CONSTRAINT "NotasFiscaisEletronicas_pkey" PRIMARY KEY ( "codNfe" );

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_chaveAcessoNfe_key"
            ON "NotasFiscaisEletronicas" ( "chaveAcessoNfe" )
            WHERE "isActive";

        CREATE UNIQUE INDEX "NotasFiscaisEletronicas_compra_ativa_key"
            ON "NotasFiscaisEletronicas" ( "numero", "modelo", "serie", "codFornecedor" )
            WHERE "isActive";

        ALTER TABLE "ProdutoNfe"
            ADD COLUMN "codNfe" INTEGER NOT NULL,
            ADD CONSTRAINT "ProdutoNfe_pkey" PRIMARY KEY ( "codNfe", "codProduto" ),
            ADD CONSTRAINT "ProdutoNfe_codNfe_fkey"
                FOREIGN KEY ( "codNfe" ) REFERENCES "NotasFiscaisEletronicas" ( "codNfe" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        ALTER TABLE "VeiculoNfe"
            ADD COLUMN "codNfe" INTEGER NOT NULL,
            ADD CONSTRAINT "VeiculoNfe_pkey" PRIMARY KEY ( "codNfe", "codVeiculo" ),
            ADD CONSTRAINT "VeiculoNfe_codNfe_fkey"
                FOREIGN KEY ( "codNfe" ) REFERENCES "NotasFiscaisEletronicas" ( "codNfe" )
                ON DELETE RESTRICT ON UPDATE CASCADE,
            ADD CONSTRAINT "VeiculoNfe_codForn_fkey"
                FOREIGN KEY ( "codForn" ) REFERENCES "Fornecedores" ( "codForn" )
                ON DELETE RESTRICT ON UPDATE CASCADE;

        CREATE INDEX "VeiculoNfe_codForn_idx" ON "VeiculoNfe" ( "codForn" );
    ` );
};
