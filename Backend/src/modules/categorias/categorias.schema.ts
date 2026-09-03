import { z } from 'zod';

export const createCategoriaSchema = z.object
(
    {
        categoria: z
            .string
            (
                {
                    message: 'O nome da categoria é obrigatório.'
                }
            )
            .trim()
            .min ( 1, 'Informe o nome da categoria.' )
            .max ( 40, 'O nome da categoria deve ter no máximo 40 caracteres.' )
            .regex ( /^[^\d]+$/, 'O nome da categoria não pode conter números.' ),
    }
);

export const updateCategoriaSchema = createCategoriaSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateCategoriaInput = z.infer < typeof createCategoriaSchema >;
export type UpdateCategoriaInput = z.infer < typeof updateCategoriaSchema >;
