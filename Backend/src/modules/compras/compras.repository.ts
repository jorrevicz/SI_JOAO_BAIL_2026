import type postgres from 'postgres';
import sql from '../../lib/db';
import type Compras from '../../db/types/public/Compras';
import type CompraProduto from '../../db/types/public/CompraProduto';
import type CompraParcelas from '../../db/types/public/CompraParcelas';
import type { CabecalhoCompraInput, ParcelaCompraInput } from './compras.schema';

export interface CompraId
{
    numero:  string;
    modelo:  string;
    serie:   string;
    codForn: number;
}

export interface FiltrosCompra
{
    codForn?: number;
}

// Linha da listagem: a compra com o nome do fornecedor, para a tabela não precisar
// de uma consulta extra por linha.
// Situação da NF-e da compra (a nota tem as mesmas chaves da compra; null se não houver)
// — RN002/RN003.
export type SituacaoNotaFiscal = 'Gerada' | 'Cancelada';

export interface CompraResumo extends Compras
{
    fornecedor:         string;
    situacaoNotaFiscal: SituacaoNotaFiscal | null;
}

// Cabeçalho completo: descrições de todas as FKs (fornecedor, transportadora e
// condição de pagamento), exibidas ao lado dos códigos no formulário.
export interface CompraDetalhe extends Compras
{
    fornecedor:        string;
    situacaoNotaFiscal: SituacaoNotaFiscal | null;
    transportadora:    string | null;
    condicaoPagamento: string | null;
}

// Item com os dados do produto exibidos na tabela de itens e no rodapé da compra
// (saldo = estoque e preço de venda — RN015).
export interface CompraItem extends CompraProduto
{
    produto:    string;
    undProduto: string;
    estoque:    number;
    precoVenda: string;
}

// Parcela da compra (RN023) com a descrição da forma de pagamento, exibida ao lado do código.
export interface CompraParcela extends CompraParcelas
{
    formaDePag: string;
}

// Cabeçalho gravado: só os campos do formulário (sem os itens). O `vlrTotal` não é coluna
// de "Compras" (3FN): o service o calcula a cada leitura a partir dos itens.
export type CabecalhoCompra = Omit < CabecalhoCompraInput, 'itens' | 'parcelas' >;

// Item gravado: apenas o que o usuário informa. Valor líquido, rateio e custo unitário
// final são derivados (`compras.calculo.ts`) e não são colunas de "CompraProduto".
export interface ItemCompraGravacao
{
    codProduto:    number;
    quantidade:    number;
    valorUnitario: string;
    desconto:      string;
    unidade:       string;
}

export class ComprasRepository
{
    async List
    (
        limit:        number,
        afterCursor?: CompraId,
        filtros:      FiltrosCompra = {},
        transaction?: postgres.TransactionSql
    ): Promise < CompraResumo[] >
    {
        const client = transaction ?? sql;

        return client < CompraResumo[] >`
            SELECT compra.*,
                   fornecedor."fornecedor",
                   ( SELECT CASE WHEN nota."isActive" THEN 'Gerada' ELSE 'Cancelada' END
                     FROM   "NotasFiscaisEletronicas" nota
                     WHERE  nota."modelo"        = compra."modelo"
                     AND    nota."numero"        = compra."numero"
                     AND    nota."serie"         = compra."serie"
                     AND    nota."codFornecedor" = compra."codForn" ) AS "situacaoNotaFiscal"
            FROM   "Compras" compra
            INNER JOIN "Fornecedores" fornecedor
                    ON fornecedor."codForn" = compra."codForn"
            -- Inativos também são listados; os filtros abaixo são todos opcionais.
            WHERE  TRUE
            ${
                filtros.codForn
                    ? client`AND compra."codForn" = ${ filtros.codForn }`
                    : client``
            }
            ${
                afterCursor
                    ? client`
                        AND ( compra."numero", compra."modelo", compra."serie", compra."codForn" ) >
                            ( ${ afterCursor.numero }, ${ afterCursor.modelo }, ${ afterCursor.serie }, ${ afterCursor.codForn } )
                      `
                    : client``
            }
            ORDER BY compra."numero", compra."modelo", compra."serie", compra."codForn"
            LIMIT  ${ limit }
        `;
    }

    async FindById
    (
        id: CompraId,
        transaction?: postgres.TransactionSql
    ): Promise < CompraDetalhe | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < CompraDetalhe[] >`
            SELECT compra.*,
                   fornecedor."fornecedor",
                   transportadora."transportadora",
                   condicao."descricao" AS "condicaoPagamento",
                   ( SELECT CASE WHEN nota."isActive" THEN 'Gerada' ELSE 'Cancelada' END
                     FROM   "NotasFiscaisEletronicas" nota
                     WHERE  nota."modelo"        = compra."modelo"
                     AND    nota."numero"        = compra."numero"
                     AND    nota."serie"         = compra."serie"
                     AND    nota."codFornecedor" = compra."codForn" ) AS "situacaoNotaFiscal"
            FROM   "Compras" compra
            INNER JOIN "Fornecedores" fornecedor
                    ON fornecedor."codForn" = compra."codForn"
            LEFT  JOIN "Transportadoras" transportadora
                    ON transportadora."codTransp" = compra."codTransp"
            INNER JOIN "CondicaoDePagamento" condicao
                    ON condicao."codCondDePag" = compra."codCondDePag"
            WHERE  compra."numero" = ${ id.numero }
            AND    compra."modelo" = ${ id.modelo }
            AND    compra."serie"  = ${ id.serie }
            AND   compra."codForn" = ${ id.codForn }
        `;

        return row ?? null;
    }

    async ListItens
    (
        id: CompraId,
        transaction?: postgres.TransactionSql
    ): Promise < CompraItem[] >
    {
        const client = transaction ?? sql;

        return client < CompraItem[] >`
            SELECT item.*,
                   produto."produto",
                   produto."undProduto",
                   produto."estoque",
                   produto."precoVenda"
            FROM   "CompraProduto" item
            INNER JOIN "Produtos" produto
                    ON produto."codProd" = item."codProduto"
            WHERE  item."numero" = ${ id.numero }
            AND    item."modelo" = ${ id.modelo }
            AND    item."serie"  = ${ id.serie }
            AND   item."codForn" = ${ id.codForn }
            ORDER BY item."dtCriacao", item."codProduto"
        `;
    }

    // Não filtra `isActive`: (numero, modelo, serie, codForn) é a chave primária, então uma
    // compra removida (soft delete) continua ocupando a chave do documento — RN007.
    async ExisteDocumento
    (
        chave: CompraId,
        transaction?: postgres.TransactionSql
    ): Promise < boolean >
    {
        const client = transaction ?? sql;
        const [ row ] = await client`
            SELECT 1
            FROM   "Compras"
            WHERE  "numero"  = ${ chave.numero }
            AND    "modelo"  = ${ chave.modelo }
            AND    "serie"   = ${ chave.serie }
            AND    "codForn" = ${ chave.codForn }
            LIMIT  1
        `;

        return row !== undefined;
    }

    // A compra nasce lançada: `dtEntrada` é a data da operação (RN018).
    async Create
    (
        compra:  CompraId & CabecalhoCompra,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < Compras >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Compras[] >`
            INSERT INTO "Compras"
            (
                "numero",
                "modelo",
                "serie",
                "codForn",
                "codTransp",
                "codCondDePag",
                "dtEmissao",
                "dtChegada",
                "dtEntrada",
                "frete",
                "seguro",
                "despesas",
                "codUser"
            )
            VALUES
            (
                ${ compra.numero },
                ${ compra.modelo },
                ${ compra.serie },
                ${ compra.codForn },
                ${ compra.codTransp ?? null },
                ${ compra.codCondDePag },
                ${ compra.dtEmissao },
                ${ compra.dtChegada },
                CURRENT_TIMESTAMP,
                ${ compra.frete },
                ${ compra.seguro },
                ${ compra.despesas },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async CreateItem
    (
        id:      CompraId,
        item:    ItemCompraGravacao,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            INSERT INTO "CompraProduto"
            (
                "numero",
                "modelo",
                "serie",
                "codForn",
                "codProduto",
                "quantidade",
                "valorUnitario",
                "desconto",
                "unidade",
                "codUser"
            )
            VALUES
            (
                ${ id.numero },
                ${ id.modelo },
                ${ id.serie },
                ${ id.codForn },
                ${ item.codProduto },
                ${ item.quantidade },
                ${ item.valorUnitario },
                ${ item.desconto },
                ${ item.unidade },
                ${ codUser }
            )
        `;
    }

    async ListParcelas
    (
        id: CompraId,
        transaction?: postgres.TransactionSql
    ): Promise < CompraParcela[] >
    {
        const client = transaction ?? sql;

        return client < CompraParcela[] >`
            SELECT parcela.*,
                   forma."formaDePag"
            FROM   "CompraParcelas" parcela
            INNER JOIN "FormaDePagamento" forma
                    ON forma."codFormaDePag" = parcela."codFormaDePag"
            WHERE  parcela."numero"  = ${ id.numero }
            AND    parcela."modelo"  = ${ id.modelo }
            AND    parcela."serie"   = ${ id.serie }
            AND    parcela."codForn" = ${ id.codForn }
            ORDER BY parcela."numParcela"
        `;
    }

    async CreateParcela
    (
        id:      CompraId,
        parcela: ParcelaCompraInput,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            INSERT INTO "CompraParcelas"
            (
                "numero",
                "modelo",
                "serie",
                "codForn",
                "numParcela",
                "codFormaDePag",
                "valor",
                "dtVencimento",
                "codUser"
            )
            VALUES
            (
                ${ id.numero },
                ${ id.modelo },
                ${ id.serie },
                ${ id.codForn },
                ${ parcela.numParcela },
                ${ parcela.codFormaDePag },
                ${ parcela.valor },
                ${ parcela.dtVencimento },
                ${ codUser }
            )
        `;
    }

    // Cancelamento derivado da justificativa (a compra não tem rascunho: todo registro é
    // lançado). Cancelar também desativa o registro (`isActive = false`), que continua visível
    // nas consultas. Só a compra ainda não cancelada é cancelável; caso contrário devolve null.
    async Cancelar
    (
        id:                        CompraId,
        justificativaCancelamento: string,
        codUser:                   number,
        transaction?: postgres.TransactionSql
    ): Promise < Compras | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Compras[] >`
            UPDATE "Compras"
            SET "justificativaCancelamento" = ${ justificativaCancelamento },
                "isActive"                  = false,
                "codUser"                   = ${ codUser },
                "dtEdicao"                  = CURRENT_TIMESTAMP
            WHERE "numero"   = ${ id.numero }
            AND   "modelo"   = ${ id.modelo }
            AND   "serie"    = ${ id.serie }
            AND   "codForn" = ${ id.codForn }
            AND   "justificativaCancelamento" IS NULL
            RETURNING *
        `;

        return row ?? null;
    }
}
