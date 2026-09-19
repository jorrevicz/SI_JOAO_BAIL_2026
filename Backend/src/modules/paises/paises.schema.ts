import { z } from 'zod';

export const createPaisSchema = z.object 
( 
    {
        pais: z
            .string
            (
                {
                    message: 'O nome do país é obrigatório.'
                }
            )
            .trim()
            .min (   1, 'Informe o nome do país.'    )
            .max (   6, 'O nome do país deve ter no máximo 6 caracteres.'   )
            .regex ( /^[^\d]+$/, 'O nome do país não pode conter números.' ),

        sigla: z
            .string
            (
                {
                    message: 'A sigla é obrigatória'
                }
            )
            .trim()
            .max ( 3, 'A sigla deve ter no máximo 3 caracteres' )
            .regex ( /^[A-Za-z]+$/, 'A sigla deve conter apenas letras.' ),
        ddi: z
            .string ( { message: 'O DDI é obrigatório.' } )
            .trim()
            .min ( 1, 'O DDI é obrigatório.' )
            .max ( 4 )
            .regex ( /^[0-9]+$/, 'O DDI deve conter apenas números.' ),
        moeda: z
            .string ( { message: 'A moeda é obrigatória.' } )
            .trim()
            .min ( 1, 'A moeda é obrigatória.' )
            .max ( 3 )
            .regex ( /^[A-Za-z]+$/, 'A moeda deve conter apenas letras.' ),
    }
);

export const updatePaisSchema = createPaisSchema.extend
(
    {
        isActive: z.boolean()
    }
);

export type CreatePaisInput = z.infer < typeof createPaisSchema >;
export type UpdatePaisInput = z.infer < typeof updatePaisSchema >;