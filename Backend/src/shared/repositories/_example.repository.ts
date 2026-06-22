/**
 * MOLDE DE REPOSITÓRIO — copie e adapte para cada entidade.
 *
 * Convenções obrigatórias (ver docs/02-arquitetura.md#acesso-a-dados-postgresjs):
 * 1. Valores sempre por interpolação ${}  — nunca concatenação de string.
 * 2. Identificadores dinâmicos só por whitelist sql(col).
 * 3. Queries filtram isActive = true (exceto quando buscando inativos).
 * 4. "Deleção" é soft delete: UPDATE SET isActive = false.
 * 5. Todo INSERT preenche codUser; todo UPDATE preenche codUser + dtEdicao.
 * 6. Paginação por cursor sobre codX (sem OFFSET).
 */
import type postgres from 'postgres';
import sql from '../../lib/db';

// Tipo gerado pelo kanel — importe de src/db/<Tabela>
// import type { Paises } from '../../db/Paises';

// ---- Tipos de entrada ----
interface CreateExemploInput {
  campo: string;
  codUser: number;
}

interface UpdateExemploInput {
  campo: string;
  codUser: number;
}

// ---- Repository ----
export class ExemploRepository {
  // Listar (paginação por cursor)
  async list(limit: number, afterId?: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    return client`
      SELECT *
      FROM   "Tabela"
      WHERE  "isActive" = true
        AND  ("codX" > ${afterId ?? 0})
      ORDER BY "codX"
      LIMIT  ${limit}
    `;
  }

  // Obter por id
  async findById(id: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      SELECT *
      FROM   "Tabela"
      WHERE  "codX"     = ${id}
        AND  "isActive" = true
    `;
    return row ?? null;
  }

  // Criar
  async create(data: CreateExemploInput, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      INSERT INTO "Tabela" ("campo","codUser")
      VALUES (${data.campo},${data.codUser})
      RETURNING *
    `;
    return row;
  }

  // Atualizar
  async update(id: number, data: UpdateExemploInput, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      UPDATE "Tabela"
      SET    "campo"    = ${data.campo},
             "codUser"  = ${data.codUser},
             "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codX"    = ${id}
        AND  "isActive" = true
      RETURNING *
    `;
    return row ?? null;
  }

  // Soft delete
  async remove(id: number, codUser: number, tx?: postgres.TransactionSql) {
    const client = tx ?? sql;
    const [row] = await client`
      UPDATE "Tabela"
      SET    "isActive" = false,
             "codUser"  = ${codUser},
             "dtEdicao" = CURRENT_TIMESTAMP
      WHERE  "codX"    = ${id}
        AND  "isActive" = true
      RETURNING "codX"
    `;
    return row ?? null;
  }

  // Verificar dependentes (para RN002 em soft delete)
  async hasDependents(id: number) {
    const [row] = await sql`
      SELECT 1
      FROM   "TabelaDependente"
      WHERE  "codX"     = ${id}
        AND  "isActive" = true
      LIMIT 1
    `;
    return !!row;
  }
}