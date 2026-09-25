import type postgres from 'postgres';
import sql from '../../lib/db';
import type ContasAPagar from '../../db/types/public/ContasAPagar';
import type { DocumentoFiscalChave } from '../../shared/documento-fiscal/documentoFiscal.schema';
import type { CreateContasAPAgarInput, UpdateContasAPagarInput } from './contasPagamento.schema';

export interface ContaAPagarId
{
    numero:  string;
    modelo:  string;
    serie:   string;
    parcela: number;
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
                AND    ( "numero", "modelo", "serie", "parcela" ) >
                       ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.parcela } )
                ORDER BY "numero", "modelo", "serie", "parcela"
                LIMIT  ${ limit }
            `;
        }

        return client < ContasAPagar[] >`
            SELECT *
            FROM   "ContasAPagar"
            WHERE  "isActive" = true
            ORDER BY "numero", "modelo", "serie", "parcela"
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
            FROM   "ContasAPagar"
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
        id: ContaAPagarId,
        conta: UpdateContasAPagarInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAPagar[] >`
            UPDATE "ContasAPagar"
            SET    "codFornecedor" = ${ conta.codFornecedor },
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

    async RegistrarBaixa
    (
        id: ContaAPagarId,
        valorBaixa: string,
        dtBaixa: Date,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContasAPagar[] >`
            UPDATE "ContasAPagar"
            SET    "valorBaixa" = ${ valorBaixa },
                   "dtBaixa"    = ${ dtBaixa },
                   "codUser"    = ${ codUser },
                   "dtEdicao"   = CURRENT_TIMESTAMP
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
            AND    "parcela" = ${ id.parcela }
            AND    "isActive" = true
            RETURNING *
        `;

        return row ?? null;
    }

    async Delete
    (
        id: ContaAPagarId,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < ContaAPagarId | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < ContaAPagarId[] >`
            UPDATE "ContasAPagar"
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
