import { z } from 'zod';

export const createProcedimentoSchema = z.object
(
    {
        procedimento: z
            .string
            (
                {
                    message: 'O nome do procedimento é obrigatório.'
                }
            )
            .trim()
            .min ( 1, 'Informe o nome do procedimento.' )
            .max ( 150, 'O nome do procedimento deve ter no máximo 150 caracteres.' ),
    }
);

export const updateProcedimentoSchema = createProcedimentoSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreateProcedimentoInput = z.infer < typeof createProcedimentoSchema >;
export type UpdateProcedimentoInput = z.infer < typeof updateProcedimentoSchema >;
