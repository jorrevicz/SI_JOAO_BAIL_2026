import { describe, it, expect } from 'vitest';
import { CalcularCompra, CalcularEntradaEstoque, CalcularEstornoEstoque, CalcularParcelasCompra } from '../../modules/compras/compras.calculo';

describe ( 'CalcularCompra', () =>
{
    it ( 'calcula total dos produtos, rateio por item, custo unitário final e vlrTotal (RN011–RN012, RN016)', () =>
    {
        const resultado = CalcularCompra
        ({
            frete:    '60.00',
            seguro:   '20.00',
            despesas: '20.00',
            itens:
            [
                { codProduto: 1, quantidade: 5,  valorUnitario: '380.00', desconto: '0.00'   },
                { codProduto: 2, quantidade: 10, valorUnitario: '210.00', desconto: '100.00' },
            ],
        });

        expect ( resultado.totalProdutos ).toBe ( '3900.00' );
        expect ( resultado.totalDescontos ).toBe ( '100.00' );
        expect ( resultado.totalQuantidade ).toBe ( 15 );
        expect ( resultado.totalValorUnitario ).toBe ( '590.00' );
        // frete, seguro e despesas não entram no vlrTotal: ele é o total dos produtos
        expect ( resultado.vlrTotal ).toBe ( '3900.00' );
        expect ( resultado.itens ).toEqual
        ([
            {
                codProduto: 1, quantidade: 5, valorUnitario: '380.00', desconto: '0.00', valorLiquido: '1900.00',
                percentualRateio: '48.72', valorRateio: '48.72', custoMedioProduto: '389.74',
            },
            {
                codProduto: 2, quantidade: 10, valorUnitario: '210.00', desconto: '100.00', valorLiquido: '2000.00',
                percentualRateio: '51.28', valorRateio: '51.28', custoMedioProduto: '205.13',
            },
        ]);
    });

    it ( 'distribui os centavos residuais para que os percentuais somem 100% e o rateio some o total rateado', () =>
    {
        const resultado = CalcularCompra
        ({
            frete:    '0.10',
            seguro:   '0.00',
            despesas: '0.00',
            itens:
            [
                { codProduto: 1, quantidade: 1, valorUnitario: '1.00', desconto: '0.00' },
                { codProduto: 2, quantidade: 1, valorUnitario: '1.00', desconto: '0.00' },
                { codProduto: 3, quantidade: 1, valorUnitario: '1.00', desconto: '0.00' },
            ],
        });

        const somaPercentuais = resultado.itens.reduce ( ( soma, item ) => soma + Number ( item.percentualRateio ), 0 );
        const somaRateio      = resultado.itens.reduce ( ( soma, item ) => soma + Number ( item.valorRateio ), 0 );

        // método dos maiores restos: o centavo que sobra vai para o primeiro item
        expect ( resultado.itens.map ( ( item ) => item.percentualRateio ) ).toEqual ( [ '33.34', '33.33', '33.33' ] );
        expect ( somaPercentuais.toFixed ( 2 ) ).toBe ( '100.00' );
        expect ( somaRateio.toFixed ( 2 ) ).toBe ( '100.00' );
        expect ( resultado.vlrTotal ).toBe ( '3.00' );
    });

    it ( 'o custo do item é o líquido mais o rateio, dividido pela quantidade', () =>
    {
        const resultado = CalcularCompra
        ({
            frete:    '0.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:    [ { codProduto: 1, quantidade: 3, valorUnitario: '10.00', desconto: '1.00' } ],
        });

        // líquido 29,00 + rateio 100,00 = 129,00 / 3 = 43,00
        expect ( resultado.itens[ 0 ] ).toMatchObject
        ({
            valorLiquido:      '29.00',
            percentualRateio:  '100.00',
            valorRateio:       '100.00',
            custoMedioProduto: '43.00',
        });
        expect ( resultado.vlrTotal ).toBe ( '29.00' );
    });
});

describe ( 'CalcularEntradaEstoque (lançamento — RN013)', () =>
{
    it ( 'soma a quantidade e recalcula a média ponderada partindo do custo inicial enquanto o custo médio é 0', () =>
    {
        // (10 × 100 + 10 × 120) / 20 = 110
        expect
        (
            CalcularEntradaEstoque ( { estoque: 10, custoMedioProd: '0.00', custoProd: '100.00' }, 10, '120.00' )
        ).toEqual ( { estoque: 20, custoMedioProd: '110.00', custoProd: '120.00' } );
    });

    it ( 'usa o custo médio atual como base quando já houve compra lançada', () =>
    {
        // (20 × 110 + 20 × 140) / 40 = 125
        expect
        (
            CalcularEntradaEstoque ( { estoque: 20, custoMedioProd: '110.00', custoProd: '120.00' }, 20, '140.00' )
        ).toEqual ( { estoque: 40, custoMedioProd: '125.00', custoProd: '140.00' } );
    });

    it ( 'arredonda a média para centavos', () =>
    {
        // (1 × 10 + 2 × 10,01) / 3 = 10,0066… → 10,01
        expect
        (
            CalcularEntradaEstoque ( { estoque: 1, custoMedioProd: '10.00', custoProd: '10.00' }, 2, '10.01' ).custoMedioProd
        ).toBe ( '10.01' );
    });
});

describe ( 'CalcularEstornoEstoque (cancelamento — RN014)', () =>
{
    it ( 'retira a quantidade e remove a entrada da média; custoProd não é revertido', () =>
    {
        // (20 × 110 − 10 × 120) / 10 = 100
        expect
        (
            CalcularEstornoEstoque ( { estoque: 20, custoMedioProd: '110.00', custoProd: '120.00' }, 10, '120.00' )
        ).toEqual ( { estoque: 10, custoMedioProd: '100.00', custoProd: '120.00' } );
    });

    it ( 'zera o custo médio quando o estoque é zerado', () =>
    {
        expect
        (
            CalcularEstornoEstoque ( { estoque: 10, custoMedioProd: '100.00', custoProd: '120.00' }, 10, '100.00' )
        ).toEqual ( { estoque: 0, custoMedioProd: '0.00', custoProd: '120.00' } );
    });

    it ( 'devolve null quando o estoque atual é menor que a quantidade a estornar', () =>
    {
        expect
        (
            CalcularEstornoEstoque ( { estoque: 3, custoMedioProd: '10.00', custoProd: '10.00' }, 5, '10.00' )
        ).toBeNull();
    });

    it ( 'nunca devolve custo médio negativo', () =>
    {
        expect
        (
            CalcularEstornoEstoque ( { estoque: 2, custoMedioProd: '10.00', custoProd: '10.00' }, 1, '50.00' )?.custoMedioProd
        ).toBe ( '0.00' );
    });
});

describe ( 'CalcularParcelasCompra (RN022)', () =>
{
    const EMISSAO = new Date ( '2026-09-20T10:00:00Z' );

    it ( 'gera uma parcela por linha da condição, com valor = total × percentual e vencimento = emissão + dias', () =>
    {
        const parcelas = CalcularParcelasCompra
        (
            '1000.00',
            [
                { numParcela: 1, codFormaDePag: 2, percentual: 30, numDias: 1  },
                { numParcela: 2, codFormaDePag: 2, percentual: 70, numDias: 30 },
            ],
            EMISSAO
        );

        expect ( parcelas ).toEqual
        ([
            { numParcela: 1, codFormaDePag: 2, valor: '300.00', dtVencimento: '2026-09-21T10:00:00.000Z' },
            { numParcela: 2, codFormaDePag: 2, valor: '700.00', dtVencimento: '2026-10-20T10:00:00.000Z' },
        ]);
    });

    it ( 'distribui os centavos residuais pelos maiores restos e a soma fecha no total', () =>
    {
        const parcelas = CalcularParcelasCompra
        (
            '100.00',
            [
                { numParcela: 1, codFormaDePag: 1, percentual: 33.33, numDias: 30 },
                { numParcela: 2, codFormaDePag: 1, percentual: 33.33, numDias: 60 },
                { numParcela: 3, codFormaDePag: 1, percentual: 33.34, numDias: 90 },
            ],
            EMISSAO
        );

        const soma = parcelas.reduce ( ( acumulado, parcela ) => acumulado + Math.round ( Number ( parcela.valor ) * 100 ), 0 );

        expect ( soma ).toBe ( 10000 );
        expect ( parcelas.map ( ( parcela ) => parcela.valor ) ).toEqual ( [ '33.33', '33.33', '33.34' ] );
    });

    it ( 'ordena as parcelas pelo número', () =>
    {
        const parcelas = CalcularParcelasCompra
        (
            '10.00',
            [
                { numParcela: 2, codFormaDePag: 1, percentual: 50, numDias: 60 },
                { numParcela: 1, codFormaDePag: 1, percentual: 50, numDias: 30 },
            ],
            EMISSAO
        );

        expect ( parcelas.map ( ( parcela ) => parcela.numParcela ) ).toEqual ( [ 1, 2 ] );
    });
});
