import type postgres from 'postgres';
import sql from '../../lib/db';
import type Estados from '../../db/types/public/Estados';
import type { CreateEstadoInput, UpdateEstadoInput } from './estados.schema';

export class EstadosRepository 
{
  async List
  (
    limit: number, 
    afterId = 0, 
    codPais?: number, 
    transaction?: postgres.TransactionSql
  ): Promise < Estados[] > 
  {
    const client = transaction ?? sql;

    return client < Estados[] >`
      SELECT *
      FROM   "Estados"
      WHERE  "isActive" = true
      AND  "codEstado" > ${ afterId } 
      ${ codPais ? client 
        `
            AND "codPais" = ${ codPais }
        ` : client``
      }
      ORDER BY "codEstado"
      LIMIT  ${ limit }
    `;
  }

    async FindById 
    ( 
        id: number, 
        transaction?: postgres.TransactionSql
    ): Promise < Estados | null > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Estados[] >`
        SELECT * 
        FROM "Estados" 
        WHERE "codEstado" = ${ id } 
        AND "isActive" = true
        `;
        
        return row ?? null;
    }

    async Create
    (
        d: CreateEstadoInput, 
        codUser: number, 
        transaction?: postgres.TransactionSql
    ): Promise < Estados > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Estados[] >`
        INSERT INTO "Estados" 
        (
            "codPais", 
            "uf", 
            "estado", 
            "codUser"
        )
        VALUES 
        (
            ${ d.codPais }, 
            ${ d.uf }, 
            ${ d.estado }, 
            ${ codUser }
        )
        RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: number, 
        d: UpdateEstadoInput, 
        codUser: number, 
        transaction?: postgres.TransactionSql
    ): Promise < Estados | null > 
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Estados[] >`
        UPDATE "Estados"
        SET    "codPais"   = ${ d.codPais }, 
                "uf"       = ${ d.uf }, 
                "estado"   = ${ d.estado },
                "codUser"  = ${ codUser }, 
                "dtEdicao" = CURRENT_TIMESTAMP
        WHERE  "codEstado" = ${ id } 
        AND    "isActive"  = true
        RETURNING *
        `;

        return row ?? null;
  }

  async Delete
  (
    id: number, 
    codUser: number, 
    transaction?: postgres.TransactionSql
  ): Promise < { codEstado: number } | null > 
  {
    const client = transaction ?? sql;
    const [ row ] = await client < { codEstado: number }[] >`
        DELETE FROM "Estados"
        WHERE "codEstado" = ${ id }
        AND "isActive" = true
        RETURNING "codEstado"
    `;
    // UPDATE "Estados" 
        // SET    "isActive"  = false, 
        //      "codUser"   = ${ codUser }, 
        //      "dtEdicao"  = CURRENT_TIMESTAMP
        // WHERE  "codEstado" = ${ id } 
        // AND    "isActive"  = true 
        // RETURNING "codEstado"

    return row ?? null;
  }

  async HasDependents
  (
    id: number, 
    transaction?: postgres.TransactionSql
  ): Promise < boolean > 
  {
    const client = transaction ?? sql;
    const [ row ] = await client`
      SELECT 1 
      FROM "Cidades"  
      WHERE "codEstado" = ${ id } 
      AND "isActive" = true
      UNION ALL
      SELECT 1 
      FROM "Veiculos" 
      WHERE "codEstado" = ${ id } 
      AND "isActive" = true
      LIMIT 1
    `;

    return !!row;
  }
}