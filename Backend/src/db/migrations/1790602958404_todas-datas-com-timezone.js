/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Padroniza TODAS as colunas de data/hora do schema (exceto `pgmigrations`, tabela
 * interna do node-pg-migrate) de `TIMESTAMP(3) WITHOUT TIME ZONE` para
 * `TIMESTAMPTZ(3)` — mesmo racional da migration `contas-datas-com-timezone`
 * (aplicada só a `dtEmissao`/`dtVencimento` de ContasAPagar/ContasAReceber): um
 * valor "sem fuso" depende implicitamente do `TimeZone` da sessão para ser
 * reinterpretado corretamente; `TIMESTAMPTZ` grava o instante de forma inequívoca.
 * Cobre `dtCriacao`/`dtEdicao` (auditoria, em toda tabela) e as datas de negócio
 * específicas de cada módulo (`Compras`, `NotasFiscaisEletronicas`, `OrdemDeServicos`,
 * `ContasAPagar`/`ContasAReceber` — as duas últimas já convertidas antes, por isso o
 * `up` as pula e o `down` as preserva).
 *
 * `ALTER COLUMN ... TYPE TIMESTAMPTZ` sem `USING` reinterpreta cada valor existente a
 * partir do `TimeZone` da sessão de migração — o mesmo fuso que o driver (postgres.js)
 * já usava para gravá-los — então nenhum instante armazenado muda, só passa a ser
 * autodescritivo quanto ao fuso.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    DO $$
    DECLARE
      coluna RECORD;
    BEGIN
      FOR coluna IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND   data_type    = 'timestamp without time zone'
        AND   table_name  <> 'pgmigrations'
      LOOP
        EXECUTE format
        (
          'ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMPTZ(3)',
          coluna.table_name,
          coluna.column_name
        );
      END LOOP;
    END $$;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    DO $$
    DECLARE
      coluna RECORD;
    BEGIN
      FOR coluna IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND   data_type    = 'timestamp with time zone'
        AND   table_name  <> 'pgmigrations'
        AND   ( table_name, column_name ) NOT IN
              (
                ( 'ContasAPagar',   'dtEmissao' ),    ( 'ContasAPagar',   'dtVencimento' ),
                ( 'ContasAReceber', 'dtEmissao' ),    ( 'ContasAReceber', 'dtVencimento' )
              )
      LOOP
        EXECUTE format
        (
          'ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMP(3)',
          coluna.table_name,
          coluna.column_name
        );
      END LOOP;
    END $$;
  ` );
};
