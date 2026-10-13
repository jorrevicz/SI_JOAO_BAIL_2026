import type postgres from 'postgres';
import sql from '../../lib/db';
import type Parcelas from '../../db/types/public/Parcelas';
import { AppError } from '../../shared/errors/AppError';
import type { CreateParcelaInput, UpdateParcelaInput } from './parcelas.schema';

export class ParcelasRepository
{
    /**
     * Cursor sobre a chave composta: com `codCondDePag` pagina só por `numParcela`;
     * sem ele, usa o par (`afterCodCondDePag`, `afterNumParcela`).
     */
    async List
    (
        limit: number,
        afterNumParcela = 0,
        codCondDePag?: number,
        transaction?: postgres.TransactionSql,
        afterCodCondDePag = 0
    ): Promise < Parcelas[] >
    {
        const client = transaction ?? sql;

        return client < Parcelas[] >`
            SELECT *
            FROM   "Parcelas"
            WHERE  "isActive" = true
            ${ codCondDePag
                ? client`AND "codCondDePag" = ${ codCondDePag } AND "numParcela" > ${ afterNumParcela }`
                : client`AND ( "codCondDePag", "numParcela" ) > ( ${ afterCodCondDePag }, ${ afterNumParcela } )` }
            ORDER BY "codCondDePag", "numParcela"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        codCondDePag: number,
        numParcela: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            SELECT *
            FROM   "Parcelas"
            WHERE  "codCondDePag" = ${ codCondDePag }
            AND    "numParcela"   = ${ numParcela }
            AND    "isActive"     = true
        `;

        return row ?? null;
    }

    /**
     * Insere a parcela com o número informado. Se a chave existir só como removida
     * (soft delete), ela é reativada com os novos dados; se estiver ativa, 409.
     */
    async Create
    (
        parcela: CreateParcelaInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            INSERT INTO "Parcelas"
            (
                "codCondDePag",
                "numParcela",
                "codFormaDePag",
                "percentual",
                "numDias",
                "codUser"
            )
            VALUES
            (
                ${ parcela.codCondDePag  },
                ${ parcela.numParcela    },
                ${ parcela.codFormaDePag },
                ${ parcela.percentual    },
                ${ parcela.numDias       },
                ${ codUser }
            )
            ON CONFLICT ( "codCondDePag", "numParcela" ) DO UPDATE
            SET    "codFormaDePag" = EXCLUDED."codFormaDePag",
                   "percentual"    = EXCLUDED."percentual",
                   "numDias"       = EXCLUDED."numDias",
                   "codUser"       = EXCLUDED."codUser",
                   "dtEdicao"      = CURRENT_TIMESTAMP,
                   "isActive"      = true
            WHERE  "Parcelas"."isActive" = false
            RETURNING *
        `;

        if ( !row )
        {
            throw new AppError ( 'Já existe uma parcela com este número nesta condição de pagamento.', 409 );
        }

        return row;
    }

    async Update
    (
        codCondDePag: number,
        numParcela: number,
        parcela: UpdateParcelaInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Parcelas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Parcelas[] >`
            UPDATE "Parcelas"
            SET    "codFormaDePag" = ${ parcela.codFormaDePag },
                   "percentual"    = ${ parcela.percentual    },
                   "numDias"       = ${ parcela.numDias       },
                   "codUser"       = ${ codUser },
                   "dtEdicao"      = CURRENT_TIMESTAMP,
                   "isActive"      = ${ parcela.isActive }
            WHERE  "codCondDePag" = ${ codCondDePag }
            AND    "numParcela"   = ${ numParcela }
            AND    "isActive"     = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        codCondDePag: number,
        numParcela: number,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < { numParcela: number } | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < { numParcela: number }[] >`
            UPDATE "Parcelas"
            SET    "isActive"  = false,
                   "codUser"   = ${ codUser },
                   "dtEdicao"  = CURRENT_TIMESTAMP
            WHERE  "codCondDePag" = ${ codCondDePag }
            AND    "numParcela"   = ${ numParcela }
            AND    "isActive"     = true
            RETURNING "numParcela"
        `;

        return row ?? null;
    }
}
