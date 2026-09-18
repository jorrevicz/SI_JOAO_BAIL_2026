import { z } from 'zod';

const parcelaCondicaoSchema = z.object
(
    {
        codParcela: z
            .coerce.number()
            .int()
            .positive()
            .optional(),
        codFormaDePag: z
            .coerce.number ( { message: 'A forma de pagamento é obrigatória.' } )
            .int()
            .positive(),
        percentual: z
            .coerce.number ( { message: 'O percentual deve ser um número.' } )
            .positive ( 'O percentual deve ser maior que zero.' )
            .max ( 100 ),
        numDias: z
            .coerce.number ( { message: 'O número de dias deve ser um número inteiro.' } )
            .int()
            .min ( 1, 'A parcela deve ter ao menos 1 dia (à vista = 1).' ),
        isActive: z
            .boolean()
            .default ( true ),
    }
);

function validarParcelas
(
    parcelas: Array < { percentual: number; numDias: number } >,
    ctx:      z.RefinementCtx
): void
{
    if ( parcelas.length === 0 )
    {
        return;
    }

    const total = parcelas.reduce ( ( acc, parcela ) => acc + parcela.percentual, 0 );
    if ( Math.round ( total * 100 ) !== 10000 )
    {
        ctx.addIssue
        ( {
            code:    'custom',
            path:    [ 'parcelas' ],
            message: `A soma dos percentuais das parcelas deve ser 100% (atual: ${ total.toFixed ( 2 ) }%).`,
        } );
    }

    for ( let i = 1; i < parcelas.length; i++ )
    {
        if ( parcelas[ i ].numDias <= parcelas[ i - 1 ].numDias )
        {
            ctx.addIssue
            ( {
                code:    'custom',
                path:    [ 'parcelas' ],
                message: 'Cada parcela deve ter um número de dias maior que a anterior (dias não podem se repetir).',
            } );
            break;
        }
    }
}

const camposCondicao = {
    descricao: z
        .string()
        .trim()
        .min ( 1, 'Informe a descrição.' )
        .max ( 60 ),
    juroCondPag: z
        .coerce.number ( { message: 'Juros deve ser um número.' } )
        .nonnegative ( 'Juros não pode ser negativo.' ),
    multaCondPag: z
        .coerce.number ( { message: 'Multa deve ser um número.' } )
        .nonnegative ( 'Multa não pode ser negativa.' ),
    descontoCondPag: z
        .coerce.number ( { message: 'Desconto deve ser um número.' } )
        .nonnegative ( 'Desconto não pode ser negativo.' ),
    parcelas: z
        .array ( parcelaCondicaoSchema )
        .min ( 1, 'A condição deve ter ao menos uma parcela.' ),
};

export const createCondicaoPagamentoSchema = z
    .object ( camposCondicao )
    .superRefine ( ( data, ctx ) => validarParcelas ( data.parcelas, ctx ) );

const camposCondicaoEdicao = {
    descricao: camposCondicao.descricao,
    parcelas:  camposCondicao.parcelas,
    isActive:  z.boolean(),
};

export const updateCondicaoPagamentoSchema = z
    .object ( camposCondicaoEdicao )
    .superRefine ( ( data, ctx ) => validarParcelas ( data.parcelas, ctx ) );

export type CreateCondicaoPagamentoInput = z.infer < typeof createCondicaoPagamentoSchema >;
export type UpdateCondicaoPagamentoInput = z.infer < typeof updateCondicaoPagamentoSchema >;
export type ParcelaCondicaoItem         = z.infer < typeof parcelaCondicaoSchema >;
