import type postgres from 'postgres';
import sql from '../../lib/db';
import type ContasAReceber from '../../db/types/public/ContasAReceber';
import type { CreateContasAReceberInput, ChaveContaAReceber } from './contasReceber.schema';

export interface ContaAReceberId
{
    numero:     string;
    modelo:     string;
    serie:      string;
    codCliente: number;
    parcela:    number;
}

export class ContasReceberRepository
{
    async List
    (
        limit: number,
        afterCursor?: ContaAReceberId,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber[] >
    {
        const client = transaction ?? sql;

        if ( afterCursor )
        {
            return client < ContasAReceber[] >`
                SELECT *
                FROM   "ContasAReceber"
                WHERE  "isActive" = true
                AND    ( "numero", "modelo", "serie", "codCliente", "parcela" ) >
                       ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.codCliente }, ${ afterCursor.parcela } )
                ORDER BY "numero", "modelo", "serie", "codCliente", "parcela"
                LIMIT  ${ limit }
            `;
        }

        return client < ContasAReceber[] >`
            SELECT *
            FROM   "ContasAReceber"
            WHERE  "isActive" = true
            ORDER BY "numero", "modelo", "serie", "codCliente", "parcela"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: ContaAReceberId,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAReceber[] >`
            SELECT *
            FROM   "ContasAReceber"
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "codCliente" = ${ id.codCliente }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
        `;

        return row ?? null;
    }

    async ExisteDocumento
    (
        chave: ChaveContaAReceber,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT 1
            FROM   "ContasAReceber"
            WHERE  "numero" = ${ chave.numero }
            AND    "modelo" = ${ chave.modelo }
            AND    "serie"  = ${ chave.serie }
            AND    "codCliente" = ${ chave.codCliente }
            AND    "parcela" = ${ chave.parcela }
            AND    "isActive" = true
            LIMIT  1
        `;

        return row !== undefined;
    }

    async Create
    (
        conta: CreateContasAReceberInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAReceber[] >`
            INSERT INTO "ContasAReceber"
            (
                "numero",
                "modelo",
                "serie",
                "parcela",
                "codCliente",
                "codFormaDePag",
                "dtEmissao",
                "dtVencimento",
                "valor",
                "juro",
                "desconto",
                "multa",
                "valorBaixa",
                "dtBaixa",
                "dtPagamento",
                "codUser"
            )
            VALUES
            (
                ${ conta.numero },
                ${ conta.modelo },
                ${ conta.serie },
                ${ conta.parcela },
                ${ conta.codCliente },
                ${ conta.codFormaDePag },
                ${ conta.dtEmissao },
                ${ conta.dtVencimento },
                ${ conta.valor ?? null },
                ${ conta.juro ?? null },
                ${ conta.desconto ?? null },
                ${ conta.multa ?? null },
                ${ conta.valorBaixa },
                ${ conta.dtBaixa },
                ${ conta.dtPagamento },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Cancelar
    (
        id: ContaAReceberId,
        justificativaCancelamento: string,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAReceber[] >`
            UPDATE "ContasAReceber"
            SET    "justificativaCancelamento" = ${ justificativaCancelamento },
                   "codUser"                   = ${ codUser },
                   "dtEdicao"                  = CURRENT_TIMESTAMP
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "codCliente" = ${ id.codCliente }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    }

}
