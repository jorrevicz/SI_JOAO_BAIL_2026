import type postgres from 'postgres';
import sql from '../../lib/db';
import type NotasFiscaisEletronicas from '../../db/types/public/NotasFiscaisEletronicas';

// Chave da NF-e: as mesmas chaves da compra de origem (documento + fornecedor), que são a
// chave primária da nota e a FK composta para "Compras".
export interface NotaFiscalId
{
    numero:        string;
    modelo:        string;
    serie:         string;
    codFornecedor: number;
}

export interface FiltrosNotaFiscal
{
    codFornecedor?: number;
}

// Linha da listagem: a nota com o nome do fornecedor e as despesas da compra de origem,
// que entram no total da nota (calculado no service — nenhum total é coluna do banco).
export interface NotaFiscalResumo extends NotasFiscaisEletronicas
{
    fornecedor: string;
    frete:      string;
    seguro:     string;
    despesas:   string;
}

// Cabeçalho completo: emitente (fornecedor), transporte e datas vêm da compra de origem
// — a NF-e não duplica esses dados (3FN).
export interface NotaFiscalDetalhe extends NotaFiscalResumo
{
    cpfCnpjForn:     string;
    inscEstSubTrib:  string;
    codTransp:       number | null;
    transportadora:  string | null;
    dtEmissaoCompra: Date;
    dtChegada:       Date;
}

// Item com nomes de API (as colunas de "ProdutoNfe" levam o prefixo `prod…Nfe`).
export interface NotaFiscalItem
{
    codProduto:    number;
    produto:       string;
    undProduto:    string;
    cfop:          string;
    csosn:         string;
    quantidade:    number;
    valorUnitario: string;
    desconto:      string;
    aliqIcms:      string;
    aliqIpi:       string;
}

export interface CabecalhoNotaFiscalGravacao
{
    chaveAcessoNfe: string;
    dhEmiNfe:       Date;
    dhSaiNfe?:      Date | null;
    fretePorConta:  string;
    infoCompl?:     string | null;
}

export type ItemNotaFiscalGravacao = Omit < NotaFiscalItem, 'produto' | 'undProduto' >;

export class NotasFiscaisRepository
{
    async List
    (
        limit:          number,
        afterCursor?:   NotaFiscalId,
        filtros:        FiltrosNotaFiscal = {},
        transaction?:   postgres.TransactionSql
    ): Promise < NotaFiscalResumo[] >
    {
        const client = transaction ?? sql;

        // Canceladas (inativas) também são listadas, como em Compras. O cursor segue a ordem
        // da chave primária (`modelo`, `numero`, `serie`, `codFornecedor`).
        return client < NotaFiscalResumo[] >`
            SELECT nota.*,
                   fornecedor."fornecedor",
                   compra."frete",
                   compra."seguro",
                   compra."despesas"
            FROM   "NotasFiscaisEletronicas" nota
            INNER JOIN "Fornecedores" fornecedor
                    ON fornecedor."codForn" = nota."codFornecedor"
            INNER JOIN "Compras" compra
                    ON compra."numero"  = nota."numero"
                   AND compra."modelo"  = nota."modelo"
                   AND compra."serie"   = nota."serie"
                   AND compra."codForn" = nota."codFornecedor"
            WHERE  TRUE
            ${
                filtros.codFornecedor
                    ? client`AND nota."codFornecedor" = ${ filtros.codFornecedor }`
                    : client``
            }
            ${
                afterCursor
                    ? client`
                        AND ( nota."modelo", nota."numero", nota."serie", nota."codFornecedor" ) >
                            ( ${ afterCursor.modelo }, ${ afterCursor.numero }, ${ afterCursor.serie }, ${ afterCursor.codFornecedor } )
                      `
                    : client``
            }
            ORDER BY nota."modelo", nota."numero", nota."serie", nota."codFornecedor"
            LIMIT  ${ limit }
        `;
    }

    // Busca pela chave da compra; a nota cancelada também é devolvida (ela continua
    // ocupando a chave — RN003).
    async FindById
    (
        id: NotaFiscalId,
        transaction?: postgres.TransactionSql
    ): Promise < NotaFiscalDetalhe | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < NotaFiscalDetalhe[] >`
            SELECT nota.*,
                   fornecedor."fornecedor",
                   fornecedor."cpfCnpjForn",
                   fornecedor."inscEstSubTrib",
                   compra."frete",
                   compra."seguro",
                   compra."despesas",
                   compra."codTransp",
                   transportadora."transportadora",
                   compra."dtEmissao" AS "dtEmissaoCompra",
                   compra."dtChegada"
            FROM   "NotasFiscaisEletronicas" nota
            INNER JOIN "Fornecedores" fornecedor
                    ON fornecedor."codForn" = nota."codFornecedor"
            INNER JOIN "Compras" compra
                    ON compra."numero"  = nota."numero"
                   AND compra."modelo"  = nota."modelo"
                   AND compra."serie"   = nota."serie"
                   AND compra."codForn" = nota."codFornecedor"
            LEFT  JOIN "Transportadoras" transportadora
                    ON transportadora."codTransp" = compra."codTransp"
            WHERE  nota."modelo"        = ${ id.modelo }
            AND    nota."numero"        = ${ id.numero }
            AND    nota."serie"         = ${ id.serie }
            AND    nota."codFornecedor" = ${ id.codFornecedor }
        `;

        return row ?? null;
    }

    async ListItens
    (
        id: NotaFiscalId,
        transaction?: postgres.TransactionSql
    ): Promise < NotaFiscalItem[] >
    {
        const client = transaction ?? sql;

        return client < NotaFiscalItem[] >`
            SELECT item."codProduto",
                   produto."produto",
                   produto."undProduto",
                   item."prodCfopNfe"            AS "cfop",
                   item."prodCsosnNfe"           AS "csosn",
                   item."prodQtdNfe"::float8     AS "quantidade",
                   item."prodVlrUnNfe"           AS "valorUnitario",
                   item."prodVlrDescNfe"         AS "desconto",
                   item."prodAliqIcmsNfe"        AS "aliqIcms",
                   item."prodAliqIpiNfe"         AS "aliqIpi"
            FROM   "ProdutoNfe" item
            INNER JOIN "Produtos" produto
                    ON produto."codProd" = item."codProduto"
            WHERE  item."modelo"        = ${ id.modelo }
            AND    item."numero"        = ${ id.numero }
            AND    item."serie"         = ${ id.serie }
            AND    item."codFornecedor" = ${ id.codFornecedor }
            ORDER BY item."dtCriacao", item."codProduto"
        `;
    }

    async Create
    (
        id:      NotaFiscalId,
        nota:    CabecalhoNotaFiscalGravacao,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < NotasFiscaisEletronicas >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < NotasFiscaisEletronicas[] >`
            INSERT INTO "NotasFiscaisEletronicas"
            (
                "modelo",
                "numero",
                "serie",
                "codFornecedor",
                "chaveAcessoNfe",
                "dhEmiNfe",
                "dhSaiNfe",
                "fretePorConta",
                "infoCompl",
                "codUser"
            )
            VALUES
            (
                ${ id.modelo },
                ${ id.numero },
                ${ id.serie },
                ${ id.codFornecedor },
                ${ nota.chaveAcessoNfe },
                ${ nota.dhEmiNfe },
                ${ nota.dhSaiNfe ?? null },
                ${ nota.fretePorConta },
                ${ nota.infoCompl ?? null },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    }

    async CreateItem
    (
        id:      NotaFiscalId,
        item:    ItemNotaFiscalGravacao,
        codUser: number,
        transaction?: postgres.TransactionSql
    ): Promise < void >
    {
        const client = transaction ?? sql;
        await client`
            INSERT INTO "ProdutoNfe"
            (
                "modelo",
                "numero",
                "serie",
                "codFornecedor",
                "codProduto",
                "prodCfopNfe",
                "prodCsosnNfe",
                "prodQtdNfe",
                "prodVlrUnNfe",
                "prodVlrDescNfe",
                "prodAliqIcmsNfe",
                "prodAliqIpiNfe",
                "codUser"
            )
            VALUES
            (
                ${ id.modelo },
                ${ id.numero },
                ${ id.serie },
                ${ id.codFornecedor },
                ${ item.codProduto },
                ${ item.cfop },
                ${ item.csosn },
                ${ item.quantidade },
                ${ item.valorUnitario },
                ${ item.desconto },
                ${ item.aliqIcms },
                ${ item.aliqIpi },
                ${ codUser }
            )
        `;
    }

    // Cancelar desativa a nota (`isActive = false`) com a justificativa; ela continua
    // visível nas consultas e ocupando a chave da compra. Só a nota ativa é cancelável;
    // caso contrário devolve null.
    async Cancelar
    (
        id:                        NotaFiscalId,
        justificativaCancelamento: string,
        codUser:                   number,
        transaction?: postgres.TransactionSql
    ): Promise < NotasFiscaisEletronicas | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < NotasFiscaisEletronicas[] >`
            UPDATE "NotasFiscaisEletronicas"
            SET "justificativaCancelamento" = ${ justificativaCancelamento },
                "isActive"                  = false,
                "codUser"                   = ${ codUser },
                "dtEdicao"                  = CURRENT_TIMESTAMP
            WHERE "modelo"        = ${ id.modelo }
            AND   "numero"        = ${ id.numero }
            AND   "serie"         = ${ id.serie }
            AND   "codFornecedor" = ${ id.codFornecedor }
            AND   "isActive"      = true
            RETURNING *
        `;

        return row ?? null;
    }
}
