import { z } from 'zod';

export const createEstadoSchema = z.object
(
    {
        codPais: z
            .coerce.number 
            ( 
                {  
                    message: 'O país é obrigatório.' 
                } 
            )
            .int()
            .positive(),
        uf: z
            .string()
            .trim()
            .length
            ( 
                2, 
                'A UF deve ter 2 caracteres.' 
            )
            .regex ( /^[A-Za-z]+$/, 'O código UF deve possuir apenas letras' ),
        estado: z
            .string()
            .trim()
            .min 
            ( 
                1, 
                'Informe o nome do estado.' 
            )
            .max ( 22 )
            .regex ( /^[^\d]+$/, 'O nome do estado não pode conter números.' ),
    }
);

export const updateEstadoSchema = createEstadoSchema;

export type CreateEstadoInput = z.infer < typeof createEstadoSchema >;
export type UpdateEstadoInput = z.infer < typeof updateEstadoSchema >;