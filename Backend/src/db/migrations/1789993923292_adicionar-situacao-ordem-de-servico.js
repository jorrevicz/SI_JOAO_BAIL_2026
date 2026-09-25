/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Lote OS-B: `tipoOdS` (já existente) é a classificação livre da OS (ex.: "Garantia",
 * "Manutenção") — não representa progresso. `situacao` é a máquina de estados do
 * atendimento (domínio fechado, validado em Zod), começando em 'Aberta' na abertura.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "OrdemDeServicos"
            ADD COLUMN "situacao" VARCHAR(24) NOT NULL DEFAULT 'Aberta';
    ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = ( pgm ) => {
    pgm.sql ( `
        ALTER TABLE "OrdemDeServicos"
            DROP COLUMN "situacao";
    ` );
};
