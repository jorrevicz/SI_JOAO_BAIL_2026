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
            .min ( 1, 'Informe a sigla' )
            .max ( 3, 'A sigla deve ter no máximo 3 caracteres' )
            .regex ( /^[A-Za-z]+$/, 'A sigla deve conter apenas letras.' ),
        ddi: z
            .string()
            .trim()
            .max ( 4 )
            .regex ( /^\d+$/, 'O DDI deve conter apenas números.' )
            .optional(),
        moeda: z
            .string()
            .trim()
            .max ( 3 )
            .regex ( /^[A-Za-z]+$/, 'A moeda deve conter apenas letras.' )
            .optional(),
    } 
);

export const updatePaisSchema = createPaisSchema;

export type CreatePaisInput = z.infer < typeof createPaisSchema >;
export type UpdatePaisInput = z.infer < typeof updatePaisSchema >;