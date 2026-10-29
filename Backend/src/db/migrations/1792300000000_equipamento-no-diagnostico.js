/**
 * Ficha de Equipamento passa a ser registrada no diagnóstico.
 *
 * - "OrdemDeServicos"."codEquipamento" deixa de ser NOT NULL: a abertura da OS não cria
 *   mais o Equipamento; a ficha técnica é levantada pelo técnico durante o diagnóstico
 *   (e é opcional — a OS pode seguir sem ela).
 * - A FK para "Equipamentos" permanece (ON DELETE RESTRICT).
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => { pgm.sql(`
  ALTER TABLE "OrdemDeServicos"
    ALTER COLUMN "codEquipamento" DROP NOT NULL;
`) };

/**
 * Reverter falha se existir OS sem Equipamento (ainda não diagnosticada): remova ou
 * preencha essas OS antes de reverter.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => { pgm.sql(`
  ALTER TABLE "OrdemDeServicos"
    ALTER COLUMN "codEquipamento" SET NOT NULL;
`) };
