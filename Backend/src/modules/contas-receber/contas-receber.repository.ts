import type postgres from 'postgres';
import sql from '../../lib/db';
import type ContasAReceber from '../../db/types/public/ContasAReceber';
import type { DocumentoFiscalChave } from '../../shared/documento-fiscal/documentoFiscal.schema';
import type { CreateContasAReceberInput, UpdateContasAReceberInput } from './contas-receber.schema';

export interface ContaAReceberId
{
    numero:  string;
    modelo:  string;
    serie:   string;
    parcela: number;
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
                AND    ( "numero", "modelo", "serie", "parcela" ) >
                       ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.parcela } )
                ORDER BY "numero", "modelo", "serie", "parcela"
                LIMIT  ${ limit }
            `;
        }

        return client < ContasAReceber[] >`
            SELECT *
            FROM   "ContasAReceber"
            WHERE  "isActive" = true
            ORDER BY "numero", "modelo", "serie", "parcela"
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
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
        `;

        return row ?? null;
    }

    async ExisteDocumento
    (
        chave: DocumentoFiscalChave,
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
                ${ conta.dtEmissao ?? null },
                ${ conta.dtVencimento ?? null },
                ${ conta.valor ?? null },
                ${ conta.juro ?? null },
                ${ conta.desconto ?? null },
                ${ conta.multa ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async Update
    (
        id: ContaAReceberId,
        conta: UpdateContasAReceberInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAReceber[] >`
            UPDATE "ContasAReceber"
            SET    "codCliente"    = ${ conta.codCliente },
                   "codFormaDePag" = ${ conta.codFormaDePag },
                   "dtEmissao"     = ${ conta.dtEmissao ?? null },
                   "dtVencimento"  = ${ conta.dtVencimento ?? null },
                   "valor"         = ${ conta.valor ?? null },
                   "juro"          = ${ conta.juro ?? null },
                   "desconto"      = ${ conta.desconto ?? null },
                   "multa"         = ${ conta.multa ?? null },
                   "codUser"       = ${ codUser },
                   "dtEdicao"      = CURRENT_TIMESTAMP,
                   "isActive"      = ${ conta.isActive }
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    }

    async RegistrarPagamentoRecebido
    (
        id: ContaAReceberId,
        valorBaixa: string,
        dtBaixa: Date,
        dtPagamento: Date,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAReceber | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAReceber[] >`
            UPDATE "ContasAReceber"
            SET    "valorBaixa"  = ${ valorBaixa },
                   "dtBaixa"     = ${ dtBaixa },
                   "dtPagamento" = ${ dtPagamento },
                   "codUser"     = ${ codUser },
                   "dtEdicao"    = CURRENT_TIMESTAMP
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
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
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: ContaAReceberId,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContaAReceberId | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContaAReceberId[] >`
            UPDATE "ContasAReceber"
            SET    "isActive" = false,
                   "codUser"  = ${ codUser },
                   "dtEdicao" = CURRENT_TIMESTAMP
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING "numero", "modelo", "serie", "parcela"
        `;

        return row ?? null;
    }
}
