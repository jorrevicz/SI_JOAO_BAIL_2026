import { z } from 'zod';

const camposParcela = z.object
(
    {
        codFormaDePag: z
            .coerce.number ( { message: 'A forma de pagamento é obrigatória.' } )
            .int()
            .positive(),
        percentual: z
            .coerce.number ( { message: 'O percentual deve ser um número.' } )
            .positive ( 'O percentual deve ser maior que zero.' )
            .max ( 100, 'O percentual não pode exceder 100.' ),
        numDias: z
            .coerce.number ( { message: 'O número de dias deve ser um número inteiro.' } )
            .int()
            .min ( 1, 'A parcela deve ter ao menos 1 dia (à vista = 1).' ),
    }
);

export const createParcelaSchema = camposParcela.extend
(
    {
        codCondDePag: z
            .coerce.number ( { message: 'A condição de pagamento é obrigatória.' } )
            .int()
            .positive(),
        numParcela: z
            .coerce.number ( { message: 'O número da parcela é obrigatório.' } )
            .int ( 'O número da parcela deve ser um inteiro.' )
            .positive ( 'O número da parcela deve ser maior que zero.' ),
    }
);

// A chave (codCondDePag, numParcela) vem da URL e não pode ser alterada.
export const updateParcelaSchema = camposParcela.extend
(
    {
        isActive: z.boolean()
    }
);
export type CreateParcelaInput = z.infer < typeof createParcelaSchema >;
export type UpdateParcelaInput = z.infer < typeof updateParcelaSchema >;
