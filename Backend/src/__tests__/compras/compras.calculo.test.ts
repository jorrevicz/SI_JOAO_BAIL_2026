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

        // ( 380 − 0 ) × 5 + ( 210 − 100 ) × 10 = 1900 + 1100
        expect ( resultado.totalProdutos ).toBe ( '3000.00' );
        expect ( resultado.totalDescontos ).toBe ( '100.00' );
        expect ( resultado.totalQuantidade ).toBe ( 15 );
        expect ( resultado.totalValorUnitario ).toBe ( '590.00' );
        // frete, seguro e despesas não entram no totalProdutos, só no vlrTotal (3000 + 60 + 20 + 20)
        expect ( resultado.vlrTotal ).toBe ( '3100.00' );
        expect ( resultado.itens ).toEqual
        ([
            {
                codProduto: 1, quantidade: 5, valorUnitario: '380.00', desconto: '0.00', valorLiquido: '1900.00',
                // rateio = 1900 ÷ 3000 × 100,00 de despesas = 63,33; custo = ( 1900 + 63,33 ) ÷ 5
                percentualRateio: '63.33', valorRateio: '63.33', custoMedioProduto: '392.666000',
            },
            {
                codProduto: 2, quantidade: 10, valorUnitario: '210.00', desconto: '100.00', valorLiquido: '1100.00',
                // o centavo que sobra vai para o maior resto: 1100 ÷ 3000 × 100,00 = 36,67
                percentualRateio: '36.67', valorRateio: '36.67', custoMedioProduto: '113.667000',
            },
        ]);
    });

    it ( 'o percentual é só a fatia do produto arredondada; o valor do rateio soma exatamente as despesas', () =>
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

        const somaRateio      = resultado.itens.reduce ( ( soma, item ) => soma + Number ( item.valorRateio ), 0 );

        // percentual = 1 ÷ 3 × 100 arredondado em 2 casas, sem redistribuir o resíduo (soma 99,99)
        expect ( resultado.itens.map ( ( item ) => item.percentualRateio ) ).toEqual ( [ '33.33', '33.33', '33.33' ] );
        // o rateio soma exatamente as despesas (frete 0,10)
        expect ( somaRateio.toFixed ( 2 ) ).toBe ( '0.10' );
        expect ( resultado.itens.map ( ( item ) => item.valorRateio ) ).toEqual ( [ '0.04', '0.03', '0.03' ] );
        expect ( resultado.vlrTotal ).toBe ( '3.10' );
    });

    it ( 'o custo do item é o valor do produto mais o rateio, dividido pela quantidade', () =>
    {
        const resultado = CalcularCompra
        ({
            frete:    '3.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:    [ { codProduto: 1, quantidade: 3, valorUnitario: '10.00', desconto: '1.00' } ],
        });

        // ( 10,00 − 1,00 ) × 3 = 27,00 + rateio 3,00 = 30,00 ÷ 3 = 10,00
        expect ( resultado.itens[ 0 ] ).toMatchObject
        ({
            valorLiquido:      '27.00',
            percentualRateio:  '100.00',
            valorRateio:       '3.00',
            custoMedioProduto: '10.000000',
        });
        expect ( resultado.totalProdutos ).toBe ( '27.00' );
        expect ( resultado.vlrTotal ).toBe ( '30.00' );
    });
});

describe ( 'CalcularCompra — precisão do custo unitário', () =>
{
    it ( 'devolve o custo unitário do item com 6 casas decimais, arredondando só no final', () =>
    {
        const resultado = CalcularCompra
        ({
            frete:    '1.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:    [ { codProduto: 1, quantidade: 3, valorUnitario: '10.00', desconto: '0.00' } ],
        });

        // ( 30,00 + 1,00 ) ÷ 3 = 10,333333…
        expect ( resultado.itens[ 0 ].custoMedioProduto ).toBe ( '10.333333' );
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
        ).toEqual ( { estoque: 20, custoMedioProd: '110.000000', custoProd: '120.000000' } );
    });

    it ( 'usa o custo médio atual como base quando já houve compra lançada', () =>
    {
        // (20 × 110 + 20 × 140) / 40 = 125
        expect
        (
            CalcularEntradaEstoque ( { estoque: 20, custoMedioProd: '110.00', custoProd: '120.00' }, 20, '140.00' )
        ).toEqual ( { estoque: 40, custoMedioProd: '125.000000', custoProd: '140.000000' } );
    });

    it ( 'arredonda a média para 6 casas decimais, só no resultado final', () =>
    {
        // (1 × 10 + 2 × 10,01) / 3 = 10,006666… → 10,006667
        expect
        (
            CalcularEntradaEstoque ( { estoque: 1, custoMedioProd: '10.00', custoProd: '10.00' }, 2, '10.01' ).custoMedioProd
        ).toBe ( '10.006667' );
    });

    it ( 'mantém as 6 casas do custo unitário da compra e da base na média ponderada', () =>
    {
        // (3 × 1,234567 + 7 × 2,345679) / 10 = 2,0123454 → 2,012345
        expect
        (
            CalcularEntradaEstoque ( { estoque: 3, custoMedioProd: '1.234567', custoProd: '1.000000' }, 7, '2.345679' )
        ).toEqual ( { estoque: 10, custoMedioProd: '2.012345', custoProd: '2.345679' } );
    });
});

describe ( 'CalcularEstornoEstoque (cancelamento — RN014)', () =>
{
    it ( 'retira a quantidade e remove a entrada da média; custoProd não é revertido', () =>
    {
        // (20 × 110 − 10 × 120) / 10 = 100
        expect
        (
            CalcularEstornoEstoque ( { estoque: 20, custoMedioProd: '110.000000', custoProd: '120.000000' }, 10, '120.000000' )
        ).toEqual ( { estoque: 10, custoMedioProd: '100.000000', custoProd: '120.000000' } );
    });

    it ( 'zera o custo médio quando o estoque é zerado', () =>
    {
        expect
        (
            CalcularEstornoEstoque ( { estoque: 10, custoMedioProd: '100.000000', custoProd: '120.000000' }, 10, '100.000000' )
        ).toEqual ( { estoque: 0, custoMedioProd: '0.000000', custoProd: '120.000000' } );
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
        ).toBe ( '0.000000' );
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
