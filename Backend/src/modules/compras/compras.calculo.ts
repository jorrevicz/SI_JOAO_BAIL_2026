// Cálculo da compra — o Backend é a fonte de verdade dos totais (o Frontend só exibe uma
// prévia). Toda a aritmética é feita em centavos inteiros para não acumular erro de
// ponto flutuante; os valores entram e saem como strings decimais com 2 casas, o mesmo
// formato das colunas DECIMAL(10,2) devolvidas pelo postgres.js.

export interface ItemCompraEntrada
{
    codProduto:    number;
    quantidade:    number;
    valorUnitario: string;
    desconto:      string;
}

export interface ItemCompraCalculado extends ItemCompraEntrada
{
    valorLiquido:      string;
    percentualRateio:  string;
    valorRateio:       string;
    custoMedioProduto: string;
}

export interface CompraEntrada
{
    frete:    string;
    seguro:   string;
    despesas: string;
    itens:    ItemCompraEntrada[];
}

export interface CompraCalculada
{
    totalProdutos:  string;
    totalDescontos: string;
    vlrTotal:       string;
    // Totais das demais colunas da tabela de itens (RN012)
    totalQuantidade:       number;
    totalValorUnitario:    string;
    itens:         ItemCompraCalculado[];
}

function ParaCentavos ( valor: string ): number
{
    return Math.round ( Number ( valor ) * 100 );
}

function DeCentavos ( centavos: number ): string
{
    const inteiro  = Math.trunc ( centavos / 100 );
    const centimos = String ( centavos % 100 ).padStart ( 2, '0' );

    return `${ inteiro }.${ centimos }`;
}

/**
 * Reparte `total` (inteiro) proporcionalmente aos `pesos` pelo método dos maiores restos:
 * cada parte recebe o piso da sua cota e as unidades que sobram vão, uma a uma, para as
 * partes de maior resto (empate: a que vem primeiro). Garante partes inteiras, não
 * negativas e com soma exatamente igual a `total`.
 */
function RepartirProporcional ( total: number, pesos: number[] ): number[]
{
    const somaPesos = pesos.reduce ( ( soma, peso ) => soma + peso, 0 );

    const cotas  = pesos.map ( ( peso ) => total * peso / somaPesos );
    const partes = cotas.map ( ( cota ) => Math.floor ( cota ) );

    let sobra = total - partes.reduce ( ( soma, parte ) => soma + parte, 0 );

    const ordemPorResto = cotas
        .map ( ( cota, indice ) => ( { indice, resto: cota - Math.floor ( cota ) } ) )
        .sort ( ( primeiro, segundo ) => segundo.resto - primeiro.resto || primeiro.indice - segundo.indice );

    for ( const { indice } of ordemPorResto )
    {
        if ( sobra === 0 )
        {
            break;
        }

        partes[ indice ] += 1;
        sobra -= 1;
    }

    return partes;
}

/**
 * - líquido do item (`valorLiquido`) = quantidade × valorUnitario − desconto (desconto só
 *   por item, RN016);
 * - total dos produtos = Σ líquidos (RN012);
 * - frete + seguro + despesas são rateados proporcionalmente ao líquido de cada item,
 *   em percentual e em valor (RN011);
 * - custo unitário final do item (`custoMedioProduto`) = ( líquido + rateio ) / quantidade;
 * - vlrTotal = total dos produtos + frete + seguro + despesas.
 *
 * Pressupõe itens já validados pelo schema (ao menos um item, quantidade > 0 e desconto
 * menor que o valor bruto — logo, todo líquido é positivo).
 */
export function CalcularCompra ( compra: CompraEntrada ): CompraCalculada
{
    const liquidos = compra.itens.map ( ( item ) =>
        item.quantidade * ParaCentavos ( item.valorUnitario ) - ParaCentavos ( item.desconto )
    );

    const totalProdutos = liquidos.reduce ( ( soma, liquido ) => soma + liquido, 0 ); 

    // Percentual inteiro, sem casas decimais (100 = 100%); a soma fecha em 100.
    const percentuais = RepartirProporcional ( 10000, liquidos );

    // Valor do rateio
    // Rᵢ = D × Lᵢ / TP
    // Também pelo método dos maiores restos: cada item recebe o piso da sua cota em centavos, e os centavos que sobram vão um a um para os itens de maior resto. Por isso Σ Rᵢ = D exatamente.
    const rateios     = RepartirProporcional ( 10000, liquidos );

    const itens = compra.itens.map ( ( item, indice ) => (
    {
        ...item,
        valorLiquido:      DeCentavos ( liquidos[ indice ] ),
        percentualRateio:  DeCentavos ( percentuais[ indice ] ),
        valorRateio:       DeCentavos ( rateios[ indice ] ),
        custoMedioProduto: DeCentavos ( Math.round ( ( liquidos[ indice ] + rateios[ indice ] ) / item.quantidade ) ),
    } ) );

    const totalQuantidade = compra.itens.reduce ( ( soma, item ) => soma + item.quantidade, 0 );

    const totalValorUnitario = compra.itens.reduce ( ( soma, item ) => soma + ParaCentavos ( item.valorUnitario ), 0 );

    // Percentual de rateio
    // %ᵢ = 100 × Lᵢ / TP
    // O arredondamento usa o método dos maiores restos, então os percentuais somam exatamente 100,00.


    const totalDescontos = compra.itens.reduce ( ( soma, item ) => soma + ParaCentavos ( item.desconto ), 0 );

    // Totais por coluna da tabela de itens (RN012) e o total da compra.
    return {
        totalProdutos:  DeCentavos ( totalProdutos ),
        totalDescontos: DeCentavos ( totalDescontos ),
        vlrTotal:       DeCentavos ( totalProdutos ),
        totalQuantidade,
        totalValorUnitario:    DeCentavos ( totalValorUnitario ),
        itens,
    };
}

// ------------------------------------------------------------------
// Parcelas da compra (RN022)
// ------------------------------------------------------------------

export interface ParcelaCondicaoEntrada
{
    numParcela:    number;
    codFormaDePag: number;
    percentual:    number | string;
    numDias:       number;
}

export interface ParcelaCompraCalculada
{
    numParcela:    number;
    codFormaDePag: number;
    valor:         string;
    dtVencimento:  string;
}

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * RN022 — parcelas da compra a partir das `Parcelas` da condição de pagamento: valor =
 * `vlrTotal × percentual` (centavos residuais pelos maiores restos, para a soma fechar no
 * total) e vencimento = emissão + `numDias`. As parcelas saem ordenadas pelo número.
 * Só calcula — o que o usuário ajustar depois vale apenas para a compra (RN023).
 */
export function CalcularParcelasCompra
(
    vlrTotal: string,
    parcelasCondicao: ParcelaCondicaoEntrada[],
    dtEmissao: Date
): ParcelaCompraCalculada[]
{
    const ordenadas = [ ...parcelasCondicao ].sort ( ( primeira, segunda ) => primeira.numParcela - segunda.numParcela );

    // Percentual em centésimos (30.00% → 3000) para o rateio ser exato em inteiros.
    const valores = RepartirProporcional
    (
        ParaCentavos ( vlrTotal ),
        ordenadas.map ( ( parcela ) => Math.round ( Number ( parcela.percentual ) * 100 ) )
    );

    return ordenadas.map ( ( parcela, indice ) => (
    {
        numParcela:    parcela.numParcela,
        codFormaDePag: parcela.codFormaDePag,
        valor:         DeCentavos ( valores[ indice ] ),
        dtVencimento:  new Date ( dtEmissao.getTime() + parcela.numDias * MILISSEGUNDOS_POR_DIA ).toISOString(),
    } ) );
}

// ------------------------------------------------------------------
// Movimentação de estoque e custo dos produtos (Lote C-3)
// ------------------------------------------------------------------

export interface EstoqueCustoProduto
{
    estoque:        number;
    custoMedioProd: string;
    custoProd:      string;
}

/**
 * Entrada de um item de compra lançada (RN013): soma a quantidade ao estoque e recalcula
 * o custo médio ponderado, `( estoque × base + quantidade × custoUnitario ) / novoEstoque`.
 * Enquanto o custo médio ainda é 0 (nenhuma compra lançada), a base é o custo inicial
 * (`custoProd`). O custo unitário da compra passa a ser o `custoProd` do produto.
 */
export function CalcularEntradaEstoque
(
    produto:       EstoqueCustoProduto,
    quantidade:    number,
    custoUnitario: string
): EstoqueCustoProduto
{
    const custoMedioAtual = ParaCentavos ( produto.custoMedioProd );
    const base            = custoMedioAtual > 0 ? custoMedioAtual : ParaCentavos ( produto.custoProd );
    const custoEntrada    = ParaCentavos ( custoUnitario );
    const estoque         = produto.estoque + quantidade;

    return {
        estoque,
        custoMedioProd: DeCentavos ( Math.round ( ( produto.estoque * base + quantidade * custoEntrada ) / estoque ) ),
        custoProd:      DeCentavos ( custoEntrada ),
    };
}

/**
 * Estorno de um item de compra cancelada (RN014): retira a quantidade do estoque e
 * remove a entrada da média, `( estoque × médio − quantidade × custoUnitario ) / novoEstoque`;
 * zerando o estoque, o custo médio volta a 0 (nunca fica negativo). `custoProd` não é
 * revertido — o custo anterior à compra não é guardado. Devolve null quando o estoque
 * atual é menor que a quantidade a estornar (parte já saiu do estoque).
 */
export function CalcularEstornoEstoque
(
    produto:       EstoqueCustoProduto,
    quantidade:    number,
    custoUnitario: string
): EstoqueCustoProduto | null
{
    if ( produto.estoque < quantidade )
    {
        return null;
    }

    const estoque = produto.estoque - quantidade;

    let custoMedio = 0;

    if ( estoque > 0 )
    {
        const restante = produto.estoque * ParaCentavos ( produto.custoMedioProd ) - quantidade * ParaCentavos ( custoUnitario );

        custoMedio = Math.max ( Math.round ( restante / estoque ), 0 );
    }

    return {
        estoque,
        custoMedioProd: DeCentavos ( custoMedio ),
        custoProd:      produto.custoProd,
    };
}
