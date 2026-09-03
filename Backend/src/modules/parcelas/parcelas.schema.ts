import { z } from 'zod';

export const createParcelaSchema = z.object
(
    {
        codCondDePag: z
            .coerce.number ( { message: 'A condição de pagamento é obrigatória.' } )
            .int()
            .positive(),
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

export const updateParcelaSchema = createParcelaSchema.extend
(
    {
        isActive: z.boolean()
    }
);
export type CreateParcelaInput = z.infer < typeof createParcelaSchema >;
export type UpdateParcelaInput = z.infer < typeof updateParcelaSchema >;
