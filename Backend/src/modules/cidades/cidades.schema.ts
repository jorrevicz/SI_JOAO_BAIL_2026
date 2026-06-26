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
            .regex ( /^[A-Za-z]+$/, 'O nome da cidade não pode conter números.'),
        ddd: z
            .string()
            .trim()
            .length ( 2, 'O DDD deve ter 2 dígitos.' )
            .regex ( /^[^\d]+$/, 'O DDD deve conter apenas números.')
            .optional(),
    }
);

export const updateCidadeSchema = createCidadeSchema;
export type CreateCidadeInput = z.infer < typeof createCidadeSchema >;
export type UpdateCidadeInput = z.infer < typeof updateCidadeSchema >;
