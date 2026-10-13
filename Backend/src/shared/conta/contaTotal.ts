// Valor total de uma conta (a pagar ou a receber) — calculado pelo Backend a cada leitura e
// nunca persistido (3FN): é o valor da conta acrescido de juro e multa e abatido o desconto.
// A aritmética é em centavos inteiros, como em `compras.calculo.ts`.

export interface ValoresConta
{
    valor:    string;
    juro:     string;
    multa:    string;
    desconto: string;
}

function ParaCentavos ( valor: string ): number
{
    return Math.round ( Number ( valor ) * 100 );
}

export function CalcularVlrTotalConta ( conta: ValoresConta ): string
{
    const centavos = ParaCentavos ( conta.valor ) + ParaCentavos ( conta.juro ) + ParaCentavos ( conta.multa ) - ParaCentavos ( conta.desconto );
    const sinal    = centavos < 0 ? '-' : '';
    const absoluto = Math.abs ( centavos );

    return `${ sinal }${ Math.trunc ( absoluto / 100 ) }.${ String ( absoluto % 100 ).padStart ( 2, '0' ) }`;
}

export function ComVlrTotal < Conta extends ValoresConta > ( conta: Conta ): Conta & { vlrTotal: string };
export function ComVlrTotal < Conta extends ValoresConta > ( conta: Conta | null ): ( Conta & { vlrTotal: string } ) | null;
export function ComVlrTotal < Conta extends ValoresConta > ( conta: Conta | null ): ( Conta & { vlrTotal: string } ) | null
{
    return conta ? { ...conta, vlrTotal: CalcularVlrTotalConta ( conta ) } : null;
}
