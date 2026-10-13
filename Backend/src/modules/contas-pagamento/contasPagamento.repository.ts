import type postgres from 'postgres';
import sql from '../../lib/db';
import type ContasAPagar from '../../db/types/public/ContasAPagar';
import type { CreateContasAPAgarInput, ChaveContaAPagar } from './contasPagamento.schema';

export interface ContaAPagarId
{
    numero:        string;
    modelo:        string;
    serie:         string;
    codFornecedor: number;
    parcela:       number;
}

export class ContasPagamentoRepository
{
    async List
    (
        limit: number,
        afterCursor?: ContaAPagarId,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar[] >
    {
        const client = transaction ?? sql;

        if ( afterCursor )
        {
            return client < ContasAPagar[] >`
                SELECT *
                FROM   "ContasAPagar"
                WHERE  "isActive" = true
                AND    ( "numero", "modelo", "serie", "codFornecedor", "parcela" ) >
                       ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.codFornecedor }, ${ afterCursor.parcela } )
                ORDER BY "numero", "modelo", "serie", "codFornecedor", "parcela"
                LIMIT  ${ limit }
            `;
        }

        return client < ContasAPagar[] >`
            SELECT *
            FROM   "ContasAPagar"
            WHERE  "isActive" = true
            ORDER BY "numero", "modelo", "serie", "codFornecedor", "parcela"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: ContaAPagarId,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAPagar[] >`
            SELECT *
            FROM   "ContasAPagar"
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "codFornecedor" = ${ id.codFornecedor }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
        `;

        return row ?? null;
    }

    async ExisteDocumento
    (
        chave: ChaveContaAPagar,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT 1
            FROM   "ContasAPagar"
            WHERE  "numero" = ${ chave.numero }
            AND    "modelo" = ${ chave.modelo }
            AND    "serie"  = ${ chave.serie }
            AND    "codFornecedor" = ${ chave.codFornecedor }
            AND    "parcela" = ${ chave.parcela }
            AND    "isActive" = true
            LIMIT  1
        `;

        return row !== undefined;
    }

    async Create
    (
        conta: CreateContasAPAgarInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAPagar[] >`
            INSERT INTO "ContasAPagar"
            (
                "numero",
                "modelo",
                "serie",
                "parcela",
                "codFornecedor",
                "codFormaDePag",
                "dtEmissao",
                "dtVencimento",
                "valor",
                "juro",
                "desconto",
                "multa",
                "valorBaixa",
                "dtBaixa",
                "codUser"
            )
            VALUES
            (
                ${ conta.numero },
                ${ conta.modelo },
                ${ conta.serie },
                ${ conta.parcela },
                ${ conta.codFornecedor },
                ${ conta.codFormaDePag },
                ${ conta.dtEmissao },
                ${ conta.dtVencimento },
                ${ conta.valor ?? null },
                ${ conta.juro ?? null },
                ${ conta.desconto ?? null },
                ${ conta.multa ?? null },
                ${ conta.valorBaixa },
                ${ conta.dtBaixa },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Cancelar
    (
        id: ContaAPagarId,
        justificativaCancelamento: string,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAPagar[] >`
            UPDATE "ContasAPagar"
            SET    "justificativaCancelamento" = ${ justificativaCancelamento },
                   "codUser"                   = ${ codUser },
                   "dtEdicao"                  = CURRENT_TIMESTAMP
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "codFornecedor" = ${ id.codFornecedor }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    }

}
