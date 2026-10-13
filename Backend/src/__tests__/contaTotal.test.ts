import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { CalcularVlrTotalConta, ComVlrTotal } from '../shared/conta/contaTotal';

describe ( 'CalcularVlrTotalConta', () =>
{
    it ( 'soma juro e multa ao valor e abate o desconto', () =>
    {
        expect ( CalcularVlrTotalConta ( { valor: '100.00', juro: '5.50', multa: '2.00', desconto: '10.25' } ) ).toBe ( '97.25' );
    });

    it ( 'não acumula erro de ponto flutuante', () =>
    {
        expect ( CalcularVlrTotalConta ( { valor: '0.10', juro: '0.20', multa: '0.00', desconto: '0.00' } ) ).toBe ( '0.30' );
    });

    it ( 'ComVlrTotal acrescenta o campo e devolve null para null', () =>
    {
        expect ( ComVlrTotal ( { valor: '10.00', juro: '0.00', multa: '1.00', desconto: '0.00' } ) ).toMatchObject ( { vlrTotal: '11.00' } );
        expect ( ComVlrTotal ( null ) ).toBeNull();
    });
});

describe.each ( [ '/api/contas-pagamento', '/api/contas-receber' ] )( 'POST %s/calcular', ( base ) =>
{
    it ( 'devolve a prévia do vlrTotal sem gravar nada', async () =>
    {
        const res = await request ( app ).post ( `${ base }/calcular` )
            .send ( { valor: '100.00', juro: '5.00', multa: '1.00', desconto: '6.00' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { vlrTotal: '100.00' } );
    });

    it ( 'retorna 400 com erros por campo quando o valor é inválido', async () =>
    {
        const res = await request ( app ).post ( `${ base }/calcular` )
            .send ( { valor: 'abc', juro: '0.00', multa: '0.00', desconto: '0.00' } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'valor' );
    });
});
