// Cálculo da compra — o Backend é a fonte de verdade dos totais (o Frontend só exibe uma
// prévia). Toda a aritmética é feita em centavos inteiros para não acumular erro de
// ponto flutuante; os valores entram e saem como strings decimais com 2 casas, o mesmo
// formato das colunas DECIMAL(10,2) devolvidas pelo postgres.js.
//
// Exceção: os custos unitários (custo do item da compra, `custoProd` e `custoMedioProd` do
// produto) têm 6 casas decimais. Eles são calculados em BigInt, em milionésimos de real
// (micro-reais), com as divisões feitas sobre o numerador exato — o arredondamento acontece
// uma única vez, no resultado final, e nunca nas etapas intermediárias.

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

export function ParaCentavos ( valor: string ): number
{
    return Math.round ( Number ( valor ) * 100 );
}

const CASAS_CUSTO   = 6;
const ESCALA_CUSTO  = 10n ** BigInt ( CASAS_CUSTO );
// 1 centavo = 10⁴ micro-reais
const MICRO_POR_CENTAVO = ESCALA_CUSTO / 100n;

// "12.345678" → 12345678n, exato (sem passar por ponto flutuante); se vierem mais de 6
// casas, arredonda a partir da 7ª.
function ParaMicro ( valor: string ): bigint
{
    const [ inteiro, fracao = '' ] = valor.trim().split ( '.' );
    const fracaoCompleta           = fracao.padEnd ( CASAS_CUSTO + 1, '0' );

    const micro = BigInt ( inteiro ) * ESCALA_CUSTO + BigInt ( fracaoCompleta.slice ( 0, CASAS_CUSTO ) );

    return fracaoCompleta[ CASAS_CUSTO ] >= '5' ? micro + 1n : micro;
}

function DeMicro ( micro: bigint ): string
{
    const fracao = String ( micro % ESCALA_CUSTO ).padStart ( CASAS_CUSTO, '0' );

    return `${ micro / ESCALA_CUSTO }.${ fracao }`;
}

// Divisão inteira com arredondamento para o mais próximo (metade para cima), para
// numerador não negativo e denominador positivo.
function DividirArredondando ( numerador: bigint, denominador: bigint ): bigint
{
    return ( 2n * numerador + denominador ) / ( 2n * denominador );
}

export function DeCentavos ( centavos: number ): string
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
 * - valor do produto (`valorLiquido`) = ( valorUnitario − desconto ) × quantidade (desconto
 *   só por item, RN016);
 * - total dos produtos = Σ valores dos produtos (RN012);
 * - rateio de frete + seguro + despesas (RN011): `valorRateio` = (( valor do produto ÷ total
 *   dos produtos ) × despesas) / quantidade) + valor do produto, com os centavos residuais pelos maiores restos (Σ rateios =
 *   despesas); `percentualRateio` = só a fatia ( valor do produto ÷ total dos produtos × 100 )
 *   arredondada em 2 casas, sem redistribuir o resíduo (a soma pode diferir de 100%);
 * - custo unitário final do item (`custoMedioProduto`) = ( valor do produto + rateio ) ÷
 *   quantidade, com 6 casas decimais;
 * - vlrTotal = total dos produtos + frete + seguro + despesas.
 *
 * Pressupõe itens já validados pelo schema (ao menos um item, quantidade > 0 e desconto
 * menor que o valor unitário — logo, todo valor de produto é positivo).
 */
export function CalcularCompra ( compra: CompraEntrada ): CompraCalculada
{
    const valoresProdutos = compra.itens.map ( ( item ) =>
        ( ParaCentavos ( item.valorUnitario ) - ParaCentavos ( item.desconto ) ) * item.quantidade
    );

    const totalProdutos = valoresProdutos.reduce ( ( soma, valorProduto ) => soma + valorProduto, 0 );

    const despesasRateadas = ParaCentavos ( compra.frete ) + ParaCentavos ( compra.seguro ) + ParaCentavos ( compra.despesas );

    // Percentual em centésimos de ponto percentual (10000 = 100%), só arredondado.
    const percentuais = valoresProdutos.map ( ( valorProduto ) => Math.round ( 10000 * valorProduto / totalProdutos ) );

    const rateios = RepartirProporcional ( despesasRateadas, valoresProdutos );

    const itens = compra.itens.map ( ( item, indice ) => (
    {
        ...item,
        valorLiquido:      DeCentavos ( valoresProdutos[ indice ] ),
        percentualRateio:  DeCentavos ( percentuais[ indice ] ),
        valorRateio:       DeCentavos ( rateios[ indice ] ),
        // custo unitário final com 6 casas: ( valor do produto + rateio ) em micro-reais ÷ quantidade
        custoMedioProduto: DeMicro (
            DividirArredondando ( BigInt ( valoresProdutos[ indice ] + rateios[ indice ] ) * MICRO_POR_CENTAVO, BigInt ( item.quantidade ) )
        ),
    } ) );

    const totalQuantidade = compra.itens.reduce ( ( soma, item ) => soma + item.quantidade, 0 );

    const totalValorUnitario = compra.itens.reduce ( ( soma, item ) => soma + ParaCentavos ( item.valorUnitario ), 0 );

    const totalDescontos = compra.itens.reduce ( ( soma, item ) => soma + ParaCentavos ( item.desconto ), 0 );

    // Totais por coluna da tabela de itens (RN012) e o total da compra.
    return {
        totalProdutos:  DeCentavos ( totalProdutos ),
        totalDescontos: DeCentavos ( totalDescontos ),
        // totalProdutos fica só com os valores dos produtos; as despesas entram apenas aqui
        vlrTotal:       DeCentavos ( totalProdutos + despesasRateadas ),
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
    const custoMedioAtual = ParaMicro ( produto.custoMedioProd );
    const base            = custoMedioAtual > 0n ? custoMedioAtual : ParaMicro ( produto.custoProd );
    const custoEntrada    = ParaMicro ( custoUnitario );
    const estoque         = produto.estoque + quantidade;

    // Numerador exato em micro-reais; um único arredondamento no final.
    const somaPonderada = BigInt ( produto.estoque ) * base + BigInt ( quantidade ) * custoEntrada;

    return {
        estoque,
        custoMedioProd: DeMicro ( DividirArredondando ( somaPonderada, BigInt ( estoque ) ) ),
        custoProd:      DeMicro ( custoEntrada ),
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

    let custoMedio = 0n;

    if ( estoque > 0 )
    {
        const restante = BigInt ( produto.estoque ) * ParaMicro ( produto.custoMedioProd ) - BigInt ( quantidade ) * ParaMicro ( custoUnitario );

        custoMedio = restante > 0n ? DividirArredondando ( restante, BigInt ( estoque ) ) : 0n;
    }

    return {
        estoque,
        custoMedioProd: DeMicro ( custoMedio ),
        custoProd:      produto.custoProd,
    };
}
