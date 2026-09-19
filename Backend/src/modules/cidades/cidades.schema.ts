import { z } from 'zod';

export const createCidadeSchema = z.object
(
    {
        codEstado: z
            .coerce.number ( { message: 'O estado é obrigatório.' } )
            .int()
            .positive(),
        cidade: z
            .string()
            .trim()
            .min ( 1, 'Informe o nome da cidade.' )
            .max ( 32 )
            .regex ( /^[^\d]+$/, 'O nome da cidade não pode conter números.'),
            
        ddd: z
            .string ( { message: 'O DDD é obrigatório.' } )
            .trim()
            .length ( 2, 'O DDD deve ter 2 dígitos.' )
            .regex ( /^[0-9]+$/, 'O DDD deve conter apenas números.')
            .refine ( ( valor ) => valor.length !== 2 || !/^0+$/.test ( valor ), 'O DDD não pode ser preenchido apenas com zeros.' ),
    }
);

export const updateCidadeSchema = createCidadeSchema.extend
(
    {
        isActive: z.boolean()
    }
);
export type CreateCidadeInput = z.infer < typeof createCidadeSchema >;
export type UpdateCidadeInput = z.infer < typeof updateCidadeSchema >;
