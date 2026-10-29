import { describe, it, expect } from 'vitest';
import { CalcularNotaFiscal } from '../../modules/notas-fiscais/notasFiscais.calculo';

describe ( 'CalcularNotaFiscal', () =>
{
    it ( 'calcula, por item, valor do produto, base e ICMS/IPI pelas alíquotas informadas', () =>
    {
        const calculo = CalcularNotaFiscal
        ( {
            frete:    '0.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:
            [
                { codProduto: 7, quantidade: 5,  valorUnitario: '380.00', desconto: '0.00',   aliqIcms: '18.00', aliqIpi: '10.00' },
                { codProduto: 8, quantidade: 10, valorUnitario: '210.00', desconto: '100.00', aliqIcms: '12.00', aliqIpi: '0.00'  },
            ],
        } );

        expect ( calculo.itens[ 0 ] ).toMatchObject
        ({
            codProduto:   7,
            valorProduto: '1900.00',
            baseIcms:     '1900.00',
            valorIcms:    '342.00',
            valorIpi:     '190.00',
        });
        expect ( calculo.itens[ 1 ] ).toMatchObject
        ({
            codProduto:   8,
            valorProduto: '2000.00',
            baseIcms:     '2000.00',
            valorIcms:    '240.00',
            valorIpi:     '0.00',
        });
    });

    it ( 'totaliza produtos, descontos, base, ICMS e IPI; o total da nota soma IPI e despesas da compra', () =>
    {
        const calculo = CalcularNotaFiscal
        ( {
            frete:    '60.00',
            seguro:   '20.00',
            despesas: '20.00',
            itens:
            [
                { codProduto: 7, quantidade: 5,  valorUnitario: '380.00', desconto: '0.00',   aliqIcms: '18.00', aliqIpi: '10.00' },
                { codProduto: 8, quantidade: 10, valorUnitario: '210.00', desconto: '100.00', aliqIcms: '12.00', aliqIpi: '0.00'  },
            ],
        } );

        expect ( calculo ).toMatchObject
        ({
            totalProdutos:  '3900.00',
            totalDescontos: '100.00',
            totalBaseIcms:  '3900.00',
            totalIcms:      '582.00',
            totalIpi:       '190.00',
            // 3900 + 190 (IPI) + 60 + 20 + 20
            vlrTotalNota:   '4190.00',
        });
    });

    it ( 'arredonda os impostos de cada item em centavos (meio centavo para cima)', () =>
    {
        const calculo = CalcularNotaFiscal
        ( {
            frete:    '0.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:
            [
                // 33.33 × 7% = 2.3331 → 2.33 ; 33.33 × 4.5% = 1.49985 → 1.50
                { codProduto: 1, quantidade: 1, valorUnitario: '33.33', desconto: '0.00', aliqIcms: '7.00', aliqIpi: '4.50' },
            ],
        } );

        expect ( calculo.itens[ 0 ].valorIcms ).toBe ( '2.33' );
        expect ( calculo.itens[ 0 ].valorIpi  ).toBe ( '1.50' );
        expect ( calculo.totalIcms ).toBe ( '2.33' );
        expect ( calculo.totalIpi  ).toBe ( '1.50' );
    });

    it ( 'alíquotas zeradas não geram imposto', () =>
    {
        const calculo = CalcularNotaFiscal
        ( {
            frete:    '0.00',
            seguro:   '0.00',
            despesas: '0.00',
            itens:
            [
                { codProduto: 1, quantidade: 2, valorUnitario: '50.00', desconto: '10.00', aliqIcms: '0.00', aliqIpi: '0.00' },
            ],
        } );

        expect ( calculo ).toMatchObject
        ({
            totalProdutos: '90.00',
            totalIcms:     '0.00',
            totalIpi:      '0.00',
            vlrTotalNota:  '90.00',
        });
    });
});
