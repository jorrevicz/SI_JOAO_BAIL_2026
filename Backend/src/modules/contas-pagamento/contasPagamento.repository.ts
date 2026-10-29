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
                WHERE  ( "numero", "modelo", "serie", "codFornecedor", "parcela" ) >
                       ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.codFornecedor }, ${ afterCursor.parcela } )
                ORDER BY "numero", "modelo", "serie", "codFornecedor", "parcela"
                LIMIT  ${ limit }
            `;
        }

        return client < ContasAPagar[] >`
            SELECT *
            FROM   "ContasAPagar"
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

    // Contas a pagar ainda não canceladas de um documento (número, modelo, série e
    // fornecedor) — todas as parcelas. Só leitura: serve para o cancelamento da compra
    // descobrir quais contas excluir, cada uma depois pela chave primária completa.
    // `FOR UPDATE` trava as linhas até o fim da transação do cancelamento.
    async ListAtivasPorDocumento
    (
        documento: Omit < ContaAPagarId, 'parcela' >,
        transaction?: postgres.TransactionSql
    ): Promise < ContasAPagar[] >
    {
        const client = transaction ?? sql;

        return client < ContasAPagar[] >`
            SELECT *
            FROM   "ContasAPagar"
            WHERE  "numero"  = ${ documento.numero }
            AND    "modelo"  = ${ documento.modelo }
            AND    "serie"   = ${ documento.serie }
            AND    "codFornecedor" = ${ documento.codFornecedor }
            AND    "justificativaCancelamento" IS NULL
            ORDER BY "parcela"
            FOR UPDATE
        `;
    }

    // Exclusão (soft delete) de uma conta a pagar: grava a justificativa e desativa o
    // registro, que continua visível nas consultas. O `WHERE` exige a chave primária
    // completa (número, modelo, série, fornecedor e parcela) — nunca uma parte dela.
    // Não há cancelamento avulso pela tela de contas: só o cancelamento da compra chama
    // este método (via `CancelarContasDaCompra`). Devolve null se a conta já estava cancelada.
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
                   "isActive"                  = false,
                   "codUser"                   = ${ codUser },
                   "dtEdicao"                  = CURRENT_TIMESTAMP
            WHERE  "numero"  = ${ id.numero }
            AND    "modelo"  = ${ id.modelo }
            AND    "serie"   = ${ id.serie }
            AND    "codFornecedor" = ${ id.codFornecedor }
            AND    "parcela" = ${ id.parcela }
            AND    "justificativaCancelamento" IS NULL
            RETURNING *
        `;

        return row ?? null;
    }

}
