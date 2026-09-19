import { z } from 'zod';

export const documentoFiscalSchema = z.object
(
    {
        numero: z
            .coerce.string ( { message: "O código numérico deve ser campo numérico com zeros à esquerda (ex: '01234567')." } )
            .min ( 8 )
            .max ( 8 )
            .nonempty ( { message: 'O documento deve possuir um código numérico.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' ),
        modelo: z
            .coerce.string ( { message: "O código do modelo deve ser campo numérico com zeros à esquerda (ex: '01')." } )
            .min ( 2 )
            .max ( 2 )
            .nonempty ( { message: 'O documento deve possuir um código do modelo.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' ),
        serie: z
            .coerce.string ( { message: "O código de série deve ser campo numérico com zeros à esquerda (ex: '01')." } )
            .min ( 2 )
            .max ( 2 )
            .nonempty ( { message: 'O documento deve possuir um código de série.' } )
            .regex ( /^[0-9]+$/, 'O identificador deve conter apenas números.' ),
    }
);

export type DocumentoFiscalChave = z.infer < typeof documentoFiscalSchema >;
