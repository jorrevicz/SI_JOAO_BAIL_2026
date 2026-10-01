/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * `dtEmissao`/`dtVencimento` de ContasAPagar e ContasAReceber eram
 * `TIMESTAMP(3) WITHOUT TIME ZONE` — o valor gravado dependia implicitamente do
 * `TimeZone` da sessão para ser reinterpretado corretamente (frágil: um dump/restore
 * ou uma sessão com `TimeZone` diferente reinterpreta o mesmo literal como outro
 * instante). Passam a `TIMESTAMPTZ(3)`, que grava o instante de forma inequívoca
 * (com offset explícito). O `ALTER COLUMN ... TYPE TIMESTAMPTZ` sem `USING`
 * reinterpreta os valores existentes a partir do `TimeZone` da sessão de migração —
 * o mesmo fuso que o driver (postgres.js) já usava para gravá-los — então nenhum
 * instante armazenado muda, só passa a ser autodescritivo quanto ao fuso.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAPagar"
      ALTER COLUMN "dtEmissao"    TYPE TIMESTAMPTZ(3),
      ALTER COLUMN "dtVencimento" TYPE TIMESTAMPTZ(3);

    ALTER TABLE "ContasAReceber"
      ALTER COLUMN "dtEmissao"    TYPE TIMESTAMPTZ(3),
      ALTER COLUMN "dtVencimento" TYPE TIMESTAMPTZ(3);
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "ContasAPagar"
      ALTER COLUMN "dtEmissao"    TYPE TIMESTAMP(3),
      ALTER COLUMN "dtVencimento" TYPE TIMESTAMP(3);

    ALTER TABLE "ContasAReceber"
      ALTER COLUMN "dtEmissao"    TYPE TIMESTAMP(3),
      ALTER COLUMN "dtVencimento" TYPE TIMESTAMP(3);
  ` );
};
