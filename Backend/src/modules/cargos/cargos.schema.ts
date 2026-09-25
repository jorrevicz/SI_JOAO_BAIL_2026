import { z } from 'zod';

export const createCargoSchema = z.object
(
    {
        cargo: z
            .string
            (
                {
                    message: 'O nome do cargo é obrigatório.'
                }
            )
            .trim()
            .min ( 1, 'Informe o nome do cargo.' )
            .max ( 15, 'O nome do cargo deve ter no máximo 15 caracteres.' ),
    }
);

export const updateCargoSchema = createCargoSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateCargoInput = z.infer < typeof createCargoSchema >;
export type UpdateCargoInput = z.infer < typeof updateCargoSchema >;
