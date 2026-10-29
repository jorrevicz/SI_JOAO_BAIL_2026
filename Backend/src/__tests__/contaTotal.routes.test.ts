import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

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
