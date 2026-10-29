import { AppError } from '../../shared/errors/AppError';
import { WithTransaction } from '../../shared/transaction/withTransaction';
import { ComprasRepository } from '../compras/compras.repository';
import type { CompraId, CompraItem } from '../compras/compras.repository';
import { NotasFiscaisRepository } from './notasFiscais.repository';
import type { NotaFiscalId, FiltrosNotaFiscal, NotaFiscalItem, ItemNotaFiscalGravacao } from './notasFiscais.repository';
import type { CalcularNotaFiscalInput, GerarNotaFiscalInput, ItemNotaFiscalInput } from './notasFiscais.schema';
import { CalcularNotaFiscal } from './notasFiscais.calculo';

type DespesasCompra = { frete: string; seguro: string; despesas: string };

export class NotasFiscaisService
{
    constructor
    (
        private readonly repo:        NotasFiscaisRepository = new NotasFiscaisRepository(),
        private readonly comprasRepo: ComprasRepository      = new ComprasRepository(),
    ) {}

    async ListNotasFiscais ( limit = 50, afterCursor?: NotaFiscalId, filtros: FiltrosNotaFiscal = {} )
    {
        const notas = await this.repo.List ( limit, afterCursor, filtros );

        // O total da nota não é persistido (3FN): sai dos itens e das despesas da compra.
        return Promise.all ( notas.map ( async ( nota ) =>
        (
            { ...nota, vlrTotalNota: this.Calcular ( nota, await this.repo.ListItens ( this.NotaIdDe ( nota ) ) ).vlrTotalNota }
        ) ) );
    }

    // Cabeçalho, itens e totais numa resposta só: base, ICMS e IPI de cada item são
    // calculados a cada leitura — nenhum deles é coluna do banco. A nota é identificada
    // pelas chaves da compra de origem (RN003 — a compra com nota só a consulta).
    async FindNotaFiscal ( id: NotaFiscalId )
    {
        const nota = await this.repo.FindById ( id );

        if ( !nota )
        {
            throw new AppError ( 'Nota fiscal não encontrada.', 404 );
        }

        const itens = await this.repo.ListItens ( id );
        const { itens: itensCalculados, ...totais } = this.Calcular ( nota, itens );

        return {
            ...nota,
            ...totais,
            itens: itens.map ( ( item, indice ) => ( { ...item, ...itensCalculados[ indice ] } ) ),
        };
    }

    /**
     * Prévia dos impostos e totais para o formulário de geração: quantidade, valor e
     * desconto vêm da compra; a tributação, do que o usuário informou. Nada é gravado.
     */
    async CalcularNotaFiscal ( data: CalcularNotaFiscalInput )
    {
        const compraId = this.CompraIdDe ( data );

        const compra      = await this.FindCompraOuFalhar ( compraId );
        const itensCompra = await this.comprasRepo.ListItens ( compraId );
        const itens       = this.MesclarItens ( itensCompra, data.itens );
        const calculo     = this.Calcular ( compra, itens );

        return {
            ...calculo,
            itens: calculo.itens.map ( ( item, indice ) =>
            (
                { ...item, produto: itens[ indice ].produto, undProduto: itens[ indice ].undProduto }
            ) ),
        };
    }

    /**
     * Gera a NF-e de entrada da compra numa única transação (RNF06): cabeçalho e itens, que
     * copiam quantidade, valor unitário e desconto da compra e recebem a tributação informada.
     * RN002 — só de compra lançada e não cancelada. RN003 — a nota tem as mesmas chaves da
     * compra como chave primária: no máximo uma por compra, inclusive cancelada (a chave
     * primária garante também sob concorrência).
     */
    async GerarNotaFiscal ( data: GerarNotaFiscalInput, codUser: number )
    {
        const id       = this.NotaIdDe ( data );
        const compraId = this.CompraIdDe ( data );

        const compra = await this.FindCompraOuFalhar ( compraId );

        if ( compra.justificativaCancelamento !== null )
        {
            throw new AppError ( 'Não é possível gerar nota fiscal de uma compra cancelada.', 409 );
        }

        const existente = await this.repo.FindById ( id );

        if ( existente )
        {
            throw new AppError
            (
                existente.isActive
                    ? 'Esta compra já possui nota fiscal gerada.'
                    : 'A nota fiscal desta compra foi cancelada; não é possível gerar outra para o mesmo documento.',
                409
            );
        }

        const itens = this.MesclarItens ( await this.comprasRepo.ListItens ( compraId ), data.itens );

        await WithTransaction ( async ( transaction ) =>
        {
            await this.repo.Create
            (
                id,
                {
                    chaveAcessoNfe: data.chaveAcessoNfe,
                    dhEmiNfe:       data.dhEmiNfe,
                    dhSaiNfe:       data.dhSaiNfe ?? null,
                    fretePorConta:  data.fretePorConta,
                    infoCompl:      data.infoCompl ?? null,
                },
                codUser,
                transaction
            );

            // Só o que é coluna de "ProdutoNfe" vai para o banco (nome e unidade são do produto).
            for ( const item of itens )
            {
                await this.repo.CreateItem
                (
                    id,
                    {
                        codProduto:    item.codProduto,
                        cfop:          item.cfop,
                        csosn:         item.csosn,
                        quantidade:    item.quantidade,
                        valorUnitario: item.valorUnitario,
                        desconto:      item.desconto,
                        aliqIcms:      item.aliqIcms,
                        aliqIpi:       item.aliqIpi,
                    },
                    codUser,
                    transaction
                );
            }
        } );

        return this.FindNotaFiscal ( id );
    }

    // A reautenticação (RN003 transversal) é feita pelo Frontend até o EP-10.
    async CancelarNotaFiscal ( id: NotaFiscalId, justificativaCancelamento: string, codUser: number )
    {
        const nota = await this.repo.FindById ( id );

        if ( !nota )
        {
            throw new AppError ( 'Nota fiscal não encontrada.', 404 );
        }

        if ( !nota.isActive )
        {
            throw new AppError ( 'Esta nota fiscal já foi cancelada.', 409 );
        }

        if ( !( await this.repo.Cancelar ( id, justificativaCancelamento, codUser ) ) )
        {
            throw new AppError ( 'Esta nota fiscal já foi cancelada.', 409 );
        }

        return this.FindNotaFiscal ( id );
    }

    private NotaIdDe ( data: NotaFiscalId ): NotaFiscalId
    {
        return { numero: data.numero, modelo: data.modelo, serie: data.serie, codFornecedor: data.codFornecedor };
    }

    // No repositório de compras o fornecedor da chave chama-se `codForn`.
    private CompraIdDe ( data: NotaFiscalId ): CompraId
    {
        return { numero: data.numero, modelo: data.modelo, serie: data.serie, codForn: data.codFornecedor };
    }

    private async FindCompraOuFalhar ( id: CompraId )
    {
        const compra = await this.comprasRepo.FindById ( id );

        if ( !compra )
        {
            throw new AppError ( 'Compra não encontrada.', 404 );
        }

        return compra;
    }

    /**
     * Os itens da nota são exatamente os produtos da compra (diferença de conjuntos nos dois
     * sentidos): cada produto da compra recebe a tributação informada para ele. Devolve os
     * itens na ordem da compra.
     */
    private MesclarItens
    (
        itensCompra: Pick < CompraItem, 'codProduto' | 'produto' | 'undProduto' | 'quantidade' | 'valorUnitario' | 'desconto' >[],
        tributacao:  ItemNotaFiscalInput[]
    ): ( ItemNotaFiscalGravacao & Pick < NotaFiscalItem, 'produto' | 'undProduto' > )[]
    {
        const produtosDaCompra = new Set < number > ( itensCompra.map ( ( item ) => item.codProduto ) );

        const estranho = tributacao.find ( ( item ) => !produtosDaCompra.has ( item.codProduto ) );

        if ( estranho )
        {
            throw new AppError ( `O produto ${ estranho.codProduto } não pertence à compra.`, 400 );
        }

        const porProduto = new Map ( tributacao.map ( ( item ) => [ item.codProduto, item ] ) );

        const faltando = itensCompra.filter ( ( item ) => !porProduto.has ( item.codProduto ) );

        if ( faltando.length > 0 )
        {
            throw new AppError
            (
                `Informe a tributação de todos os produtos da compra (falta: ${ faltando.map ( ( item ) => item.produto ).join ( ', ' ) }).`,
                400
            );
        }

        return itensCompra.map ( ( item ) =>
        {
            const tributo = porProduto.get ( item.codProduto )!;

            return {
                codProduto:    item.codProduto,
                produto:       item.produto,
                undProduto:    item.undProduto,
                cfop:          tributo.cfop,
                csosn:         tributo.csosn,
                quantidade:    item.quantidade,
                valorUnitario: item.valorUnitario,
                desconto:      item.desconto,
                aliqIcms:      tributo.aliqIcms,
                aliqIpi:       tributo.aliqIpi,
            };
        } );
    }

    private Calcular
    (
        despesas: DespesasCompra,
        itens:    Pick < NotaFiscalItem, 'codProduto' | 'quantidade' | 'valorUnitario' | 'desconto' | 'aliqIcms' | 'aliqIpi' >[]
    )
    {
        return CalcularNotaFiscal
        ( {
            frete:    despesas.frete,
            seguro:   despesas.seguro,
            despesas: despesas.despesas,
            itens:    itens.map ( ( item ) =>
            (
                {
                    codProduto:    item.codProduto,
                    quantidade:    item.quantidade,
                    valorUnitario: item.valorUnitario,
                    desconto:      item.desconto,
                    aliqIcms:      item.aliqIcms,
                    aliqIpi:       item.aliqIpi,
                }
            ) ),
        } );
    }
}
