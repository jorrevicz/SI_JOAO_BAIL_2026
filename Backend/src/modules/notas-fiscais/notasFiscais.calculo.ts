// Cálculo da NF-e de entrada — o Backend é a fonte de verdade dos impostos e totais (o
// Frontend só exibe a prévia). Base e valores de ICMS/IPI não são colunas do banco (3FN):
// são recalculados a cada leitura a partir do que foi informado por item. Mesma aritmética
// em centavos inteiros de `compras.calculo.ts`.
import { ParaCentavos, DeCentavos } from '../compras/compras.calculo';

export interface ItemNotaFiscalEntrada
{
    codProduto:    number;
    quantidade:    number;
    valorUnitario: string;
    desconto:      string;
    aliqIcms:      string;
    aliqIpi:       string;
}

export interface ItemNotaFiscalCalculado extends ItemNotaFiscalEntrada
{
    valorProduto: string;
    baseIcms:     string;
    valorIcms:    string;
    valorIpi:     string;
}

// Despesas acessórias vêm da compra de origem (a NF-e é o documento fiscal dela).
export interface NotaFiscalEntrada
{
    frete:    string;
    seguro:   string;
    despesas: string;
    itens:    ItemNotaFiscalEntrada[];
}

export interface NotaFiscalCalculada
{
    totalProdutos:  string;
    totalDescontos: string;
    totalBaseIcms:  string;
    totalIcms:      string;
    totalIpi:       string;
    vlrTotalNota:   string;
    itens:          ItemNotaFiscalCalculado[];
}

/**
 * Imposto em centavos: `base × alíquota / 100`, com a alíquota em centésimos de ponto
 * percentual (18.00% → 1800). A divisão é inteira com meio centavo arredondado para cima,
 * para não depender da representação binária de valores como 149,985.
 */
function CalcularImposto ( baseCentavos: number, aliquota: string ): number
{
    const aliquotaCentesimos = Math.round ( Number ( aliquota ) * 100 );

    return Math.floor ( ( baseCentavos * aliquotaCentesimos + 5000 ) / 10000 );
}

/**
 * - valor do produto = quantidade × valorUnitario − desconto (o mesmo líquido da compra);
 * - base do ICMS = valor do produto;
 * - ICMS = base × alíquota de ICMS; IPI = valor do produto × alíquota de IPI;
 * - total da nota = total dos produtos + IPI + frete + seguro + outras despesas
 *   (o ICMS é "por dentro" — já está no preço — e não soma ao total).
 */
export function CalcularNotaFiscal ( nota: NotaFiscalEntrada ): NotaFiscalCalculada
{
    let totalProdutos  = 0;
    let totalDescontos = 0;
    let totalIcms      = 0;
    let totalIpi       = 0;

    const itens = nota.itens.map ( ( item ) =>
    {
        const valorProduto = Math.round ( item.quantidade * ParaCentavos ( item.valorUnitario ) ) - ParaCentavos ( item.desconto );
        const valorIcms    = CalcularImposto ( valorProduto, item.aliqIcms );
        const valorIpi     = CalcularImposto ( valorProduto, item.aliqIpi );

        totalProdutos  += valorProduto;
        totalDescontos += ParaCentavos ( item.desconto );
        totalIcms      += valorIcms;
        totalIpi       += valorIpi;

        return {
            ...item,
            valorProduto: DeCentavos ( valorProduto ),
            baseIcms:     DeCentavos ( valorProduto ),
            valorIcms:    DeCentavos ( valorIcms ),
            valorIpi:     DeCentavos ( valorIpi ),
        };
    } );

    const despesas = ParaCentavos ( nota.frete ) + ParaCentavos ( nota.seguro ) + ParaCentavos ( nota.despesas );

    return {
        totalProdutos:  DeCentavos ( totalProdutos ),
        totalDescontos: DeCentavos ( totalDescontos ),
        totalBaseIcms:  DeCentavos ( totalProdutos ),
        totalIcms:      DeCentavos ( totalIcms ),
        totalIpi:       DeCentavos ( totalIpi ),
        vlrTotalNota:   DeCentavos ( totalProdutos + totalIpi + despesas ),
        itens,
    };
}
