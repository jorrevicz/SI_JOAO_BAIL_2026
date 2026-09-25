import { z } from 'zod';

export const createPecaSchema = z.object
(
    {
        peca: z
            .string
            (
                {
                    message: 'O nome da peça é obrigatório.'
                }
            )
            .trim()
            .min ( 1, 'Informe o nome da peça.' )
            .max ( 20, 'O nome da peça deve ter no máximo 20 caracteres.' ),
    }
);

export const updatePecaSchema = createPecaSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreatePecaInput = z.infer < typeof createPecaSchema >;
export type UpdatePecaInput = z.infer < typeof updatePecaSchema >;
