/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Produto ↔ Categoria passa a ser efetivamente N:N.
 *
 * A associativa "ProdutoCategoria" já existia no baseline, mas nunca foi usada por
 * nenhum módulo: o vínculo vivo era a FK 1:N "Produtos"."codCategoria", que limitava
 * o produto a uma única categoria. A intenção do modelo é que um produto pertença a
 * várias categorias, então a FK 1:N sai e a associativa assume — sem duas fontes de
 * verdade para a mesma relação.
 *
 * Os vínculos existentes são copiados para a associativa antes de a coluna cair, para
 * que nenhum produto já cadastrado perca sua categoria.
 *
 * O índice novo cobre o caminho inverso (categoria → produtos), usado por
 * `CategoriasRepository.HasDependents` (RN002) e pelo filtro de lista de produtos por
 * categoria; o caminho direto (produto → categorias) já é atendido pela PK composta.
 *
 * "ProdutoCategoria" permanece sem "isActive"/"codUser"/datas: é uma associativa de FKs
 * puras, o vínculo não tem ciclo de vida próprio e sua remoção é DELETE físico — o
 * histórico que o soft delete protege vive em "Produtos" e "Categorias".
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    -- Preserva os vínculos 1:N existentes antes de derrubar a coluna
    INSERT INTO "ProdutoCategoria" ( "codProduto", "codCategoria" )
    SELECT "codProd", "codCategoria"
    FROM   "Produtos"
    WHERE  "codCategoria" IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- A FK 1:N deixa de existir: a associativa é a única fonte de verdade da relação
    ALTER TABLE "Produtos"
      DROP CONSTRAINT "Produtos_codCategoria_fkey",
      DROP COLUMN     "codCategoria";

    -- Caminho inverso (categoria → produtos); o direto já é coberto pela PK composta
    CREATE INDEX "ProdutoCategoria_codCategoria_idx"
      ON "ProdutoCategoria" ( "codCategoria" );
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    DROP INDEX "ProdutoCategoria_codCategoria_idx";

    -- Restaura a coluna, o índice e a FK tal como definidos no baseline
    ALTER TABLE "Produtos"
      ADD COLUMN "codCategoria" INTEGER;

    CREATE INDEX "Produtos_codCategoria_idx"
      ON "Produtos" ( "codCategoria" );

    ALTER TABLE "Produtos"
      ADD CONSTRAINT "Produtos_codCategoria_fkey"
      FOREIGN KEY ( "codCategoria" ) REFERENCES "Categorias" ( "codCategoria" )
      ON DELETE RESTRICT ON UPDATE CASCADE;

    -- Backfill inverso: o modelo 1:N só comporta uma categoria por produto,
    -- então a de menor código é eleita representante
    UPDATE "Produtos" p
    SET    "codCategoria" = vinculo."codCategoria"
    FROM (
      SELECT "codProduto", MIN ( "codCategoria" ) AS "codCategoria"
      FROM   "ProdutoCategoria"
      GROUP BY "codProduto"
    ) AS vinculo
    WHERE p."codProd" = vinculo."codProduto";
  ` );
};
